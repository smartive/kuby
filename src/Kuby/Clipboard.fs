module Kuby.Clipboard

open System
open System.Diagnostics
open System.IO
open System.Reflection
open System.Runtime.InteropServices
open Kuby.ConsoleWriter
open McMaster.Extensions.CommandLineUtils

let private basePath =
    Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "kuby", "clipboard")

let private isWsl =
    if not (RuntimeInformation.IsOSPlatform OSPlatform.Linux) then
        false
    else
        use proc = new Process()

        try
            proc.StartInfo.FileName <- "which"
            proc.StartInfo.Arguments <- ArgumentEscaper.EscapeAndConcatenate [ "explorer.exe" ]
            proc.StartInfo.RedirectStandardOutput <- true
            proc.StartInfo.RedirectStandardError <- true
            proc.StartInfo.CreateNoWindow <- true
            proc.Start() |> ignore
            proc.WaitForExit()

            proc.ExitCode = 0
        with _ -> false

let private targetExecutable =
    if RuntimeInformation.IsOSPlatform OSPlatform.Windows
       || isWsl then
        Path.Join(basePath, "clipboard.exe")
    else if RuntimeInformation.IsOSPlatform OSPlatform.Linux then
        Path.Join(basePath, "xsel")
    else
        "pbcopy"

let private executable =
    let assembly = Assembly.GetExecutingAssembly()

    if RuntimeInformation.IsOSPlatform OSPlatform.Windows
       || isWsl then
        assembly.GetManifestResourceStream("Kuby.Clipboard.Windows.clipboard.exe")
    else
        assembly.GetManifestResourceStream("Kuby.Clipboard.Linux.xsel")

let private prepare () =
    async {
        if RuntimeInformation.IsOSPlatform OSPlatform.OSX
        then return ()

        if not (File.Exists targetExecutable) then
            use memStream = new MemoryStream()
            executable.CopyTo memStream
            Directory.CreateDirectory(basePath) |> ignore

            do! File.WriteAllBytesAsync(targetExecutable, memStream.ToArray())
                |> Async.AwaitTask

            if RuntimeInformation.IsOSPlatform OSPlatform.Linux then
                use chmod = new Process()
                chmod.StartInfo.FileName <- "chmod"
                chmod.StartInfo.Arguments <- ArgumentEscaper.EscapeAndConcatenate([ "+x"; targetExecutable ])
                chmod.StartInfo.CreateNoWindow <- true
                chmod.Start() |> ignore
                do! chmod.WaitForExitAsync() |> Async.AwaitTask

            writeLine [ Color($@"Installed clipboard helper at ""{targetExecutable}""", Color.Cyan) ]
    }

let copy (content: string) =
    async {
        do! prepare ()

        use proc = new Process()

        proc.StartInfo.FileName <- targetExecutable
        proc.StartInfo.RedirectStandardOutput <- true
        proc.StartInfo.RedirectStandardError <- true

        proc.StartInfo.Arguments <-
            ArgumentEscaper.EscapeAndConcatenate
                (seq {
                    if RuntimeInformation.IsOSPlatform OSPlatform.Windows
                       || isWsl then
                        "--copy"

                    if RuntimeInformation.IsOSPlatform OSPlatform.Linux
                       && not isWsl then
                        "--clipboard"
                        "--input"
                 })

        proc.StartInfo.RedirectStandardInput <- true
        proc.StartInfo.CreateNoWindow <- true
        proc.Start() |> ignore
        proc.StandardInput.Write content
        proc.StandardInput.Flush()
        proc.StandardInput.Close()

        do! proc.WaitForExitAsync() |> Async.AwaitTask
    }
