namespace Kuby.Commands.Deployment

open System
open System.Collections
open System.IO
open System.Text
open System.Text.RegularExpressions
open Kuby
open Kuby.ConsoleWriter
open Kuby.Commands
open McMaster.Extensions.CommandLineUtils

[<Command("deploy", "dep", "d", Description = "Prepare and deploy a set of given yaml files to the given cluster.")>]
type Deployment() =
    inherit BaseCommand()

    [<Argument(0,
               Name = "source",
               Description = "The (relative or absolute) folder to search for yaml files (default: ./k8s/).")>]
    member val SourceFolder = "./k8s/" with get, set

    [<Option(CommandOptionType.NoValue,
             Description =
                 "If set, do not apply the prepared yaml's with kubectl. "
                 + "Instead, print them to stdout or if output is set, write them there.")>]
    member val DryRun = false with get, set

    [<Option(CommandOptionType.SingleOrNoValue,
             Description =
                 "If set, perform a 'kube-config' command preceeding the deployment command. "
                 + "This essentially can be used to 'log in' before deploying. "
                 + "The kube config file is stored in a temp file. "
                 + "If no content is given, the env var will be used, "
                 + "otherwise the content provided with --login=<content>.")>]
    member val Login: struct (bool * string) = (false, null) with get, set

    [<Option(CommandOptionType.SingleValue,
             Description = "If set, output the prepared yaml's to this (relative or absolute) path.")>]
    member val Output = "" with get, set

    [<Option(CommandOptionType.NoValue,
             Description = "If set, delete the resources in the prepared files instead of applying them.")>]
    member val Remove = false with get, set

    [<Option(CommandOptionType.SingleValue, Description = "If set, execute kubectl on the given namespace.")>]
    member val Namespace = "" with get, set

    [<Option(CommandOptionType.SingleValue,
             Description = "If set, execute kubectl on the given context instead of default.")>]
    member val Context = "" with get, set

    [<Option(CommandOptionType.SingleValue,
             ShortName = "p",
             LongName = "env-trim-prefix",
             Description =
                 "Prefix that is trimmed from env variable keys "
                 + "(e.g 'DEV_' to replace 'DEV_TEST' to 'TEST').")>]
    member val EnvTrimPrefix = "" with get, set

    override this.Execute app =
        async {
            let sourcePath =
                Path.GetFullPath
                    (if Path.IsPathRooted this.SourceFolder
                     then this.SourceFolder
                     else Path.Join(Directory.GetCurrentDirectory(), this.SourceFolder))

            let rec getAllFiles dir =
                seq {
                    yield!
                        Directory.EnumerateFiles(dir, "*.*")
                        |> Seq.filter (fun f -> f.EndsWith(".yaml") || f.EndsWith(".yml"))

                    for d in Directory.EnumerateDirectories(dir) do
                        yield! getAllFiles d
                }

            let targetDirectory =
                if String.IsNullOrWhiteSpace this.Output then
                    Path.GetFullPath(Path.Join(Path.GetTempPath(), Path.GetRandomFileName()))
                else
                    Path.GetFullPath
                        (if Path.IsPathRooted this.Output
                         then this.Output
                         else Path.Join(Directory.GetCurrentDirectory(), this.Output))

            if not (Directory.Exists targetDirectory) then
                Directory.CreateDirectory targetDirectory
                |> ignore

            let envsubst (source: string) =
                Environment.GetEnvironmentVariables()
                |> Seq.cast<DictionaryEntry>
                |> Seq.map (fun d -> d.Key :?> string, d.Value :?> string)
                |> Map.ofSeq
                |> Map.fold (fun source key value ->
                    let envkey = Strings.trimStart this.EnvTrimPrefix key
                    Regex.Replace(source, $@"\$({envkey}|{{{envkey}}})", value)) source

            do! getAllFiles sourcePath
                |> Seq.map (fun file ->
                    async {
                        use sourceFile = File.OpenText file
                        let! source = sourceFile.ReadToEndAsync() |> Async.AwaitTask

                        use destinationFile =
                            new StreamWriter(Path.Join(targetDirectory, Path.GetFileName file), false, Encoding.UTF8)

                        do! destinationFile.WriteLineAsync(envsubst source)
                            |> Async.AwaitTask
                    })
                |> Async.Parallel
                |> Async.Ignore

            if this.DryRun then
                getAllFiles targetDirectory
                |> Seq.iter (fun f ->
                    use source = File.OpenText f

                    writeLines [ Color($@"Prepared file ""{Path.GetFileName f}"":", Color.Green)
                                 Plain(source.ReadToEnd()) ])
            else
                let kubeConfigPath =
                    Path.GetFullPath(Path.Join(Path.GetTempPath(), Path.GetRandomFileName()))

                let struct (login, loginContent) = this.Login

                if login then
                    let kc = KubeConfig()
                    kc.Path <- kubeConfigPath

                    if not (String.IsNullOrWhiteSpace loginContent)
                    then kc.Content <- loginContent

                    do! kc.Execute app |> Async.Ignore

                let! log, err =
                    Kubectl.execute
                        (seq {
                            if login then
                                "--kubeconfig"
                                kubeConfigPath

                            if not (String.IsNullOrWhiteSpace this.Context) then
                                "--context"
                                this.Context

                            if not (String.IsNullOrWhiteSpace this.Namespace) then
                                "--namespace"
                                this.Namespace

                            if this.Remove then "delete" else "apply"
                            "-f"
                            targetDirectory
                         })

                if not (String.IsNullOrWhiteSpace log) then writeLine [ Color(log, Color.Green) ]

                if not (String.IsNullOrWhiteSpace err) then writeLine [ Color(err, Color.Red) ]

            return ReturnValues.success
        }
