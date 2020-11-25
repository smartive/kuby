module Kuby.Kubectl

open System
open System.Diagnostics
open System.IO
open System.Reflection
open System.Runtime.InteropServices
open McMaster.Extensions.CommandLineUtils
open Kuby.ConsoleWriter

let version = "v1.19.4"

let private basePath =
    Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "kuby", "kubectl", version)

let private targetExecutable =
    if RuntimeInformation.IsOSPlatform OSPlatform.Windows
    then Path.Join(basePath, "kubectl.exe")
    else Path.Join(basePath, "kubectl")

let private executable =
    let assembly = Assembly.GetExecutingAssembly()

    if RuntimeInformation.IsOSPlatform OSPlatform.Windows then
        assembly.GetManifestResourceStream("Kuby.Kubectl.windows.kubectl.exe")
    else if RuntimeInformation.IsOSPlatform OSPlatform.Linux then
        assembly.GetManifestResourceStream("Kuby.Kubectl.linux.kubectl")
    else
        assembly.GetManifestResourceStream("Kuby.Kubectl.darwin.kubectl")

let private prepare () =
    async {
        if not (File.Exists targetExecutable) then
            use memStream = new MemoryStream()
            executable.CopyTo memStream
            Directory.CreateDirectory(basePath) |> ignore

            do! File.WriteAllBytesAsync(targetExecutable, memStream.ToArray())
                |> Async.AwaitTask

            if RuntimeInformation.IsOSPlatform OSPlatform.Linux
               || RuntimeInformation.IsOSPlatform OSPlatform.OSX then
                use chmod = new Process()
                chmod.StartInfo.FileName <- "chmod"
                chmod.StartInfo.Arguments <- ArgumentEscaper.EscapeAndConcatenate([ "+x"; targetExecutable ])
                chmod.StartInfo.CreateNoWindow <- true
                chmod.Start() |> ignore
                do! chmod.WaitForExitAsync() |> Async.AwaitTask

            writeLine [ Color($@"Installed kubectl at ""{targetExecutable}""", Color.Cyan) ]
    }

let execute args = async {
    do! prepare()

    use proc = new Process()

    proc.StartInfo.FileName <- targetExecutable
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.RedirectStandardError <- true
    proc.StartInfo.Arguments <- ArgumentEscaper.EscapeAndConcatenate args
    proc.StartInfo.CreateNoWindow <- true
    proc.Start() |> ignore
    do! proc.WaitForExitAsync() |> Async.AwaitTask
    let! output = proc.StandardOutput.ReadToEndAsync() |> Async.AwaitTask
    let! error = proc.StandardError.ReadToEndAsync() |> Async.AwaitTask

    return output, error
}
