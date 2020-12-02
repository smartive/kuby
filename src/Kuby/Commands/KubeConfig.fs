namespace Kuby.Commands.Deployment

open System
open System.IO
open System.Text
open DotnetKubernetesClient
open Kuby.ConsoleWriter
open Kuby.Commands
open Kuby.Kubernetes
open Kuby.Strings
open McMaster.Extensions.CommandLineUtils
open Sharprompt
open k8s.KubeConfigModels
open k8s.Models

[<Command("generate", "gen", "g", Description = "Generate a kube-config to the given cluster.")>]
type Generate() =
    inherit BaseCommand()

    let client = KubernetesClient()

    let getServiceAccounts (namespaceName: string) =
        async {
            let! serviceAccounts =
                client.List<V1ServiceAccount>(namespaceName)
                |> Async.AwaitTask

            return
                serviceAccounts
                |> Seq.map (fun sa -> sa.Name())
                |> Seq.sort
        }

    [<Argument(0, Name = "namespace", Description = "The name of the namespace to generate the config for.")>]
    member val Namespace = "" with get, set

    [<Argument(1, Name = "service-account", Description = "The name of the service account to generate the config for.")>]
    member val ServiceAccount = "" with get, set

    override this.Execute _ =
        async {
            if String.IsNullOrWhiteSpace(this.Namespace) then
                let! namespaces = Namespace.namespaceNames

                this.Namespace <- Prompt.Select($"Select namespace (arrows for nav, type for search)", namespaces, 5)

            if String.IsNullOrWhiteSpace(this.ServiceAccount) then
                let! serviceAccounts = getServiceAccounts this.Namespace

                this.ServiceAccount <-
                    Prompt.Select($"Select service account (arrows for nav, type for search)", serviceAccounts, 5)

            let! secrets =
                client.List<V1Secret>(this.Namespace)
                |> Async.AwaitTask

            match secrets
                  |> Seq.filter (fun s -> s.Type.Contains "service-account-token")
                  |> Seq.tryFind (fun s -> s.Name().StartsWith this.ServiceAccount) with
            | Some (secret) ->
                let resultConfig = K8SConfiguration()

                let token =
                    secret.Data.["token"] |> Encoding.UTF8.GetString

                let cluster =
                    match Cluster.currentCluster with
                    | Some (cluster) -> cluster
                    | _ -> Cluster()

                cluster.Name <- "cluster"

                resultConfig.ApiVersion <- "v1"
                resultConfig.Kind <- "Config"

                resultConfig.Users <-
                    [ User(Name = this.ServiceAccount, UserCredentials = UserCredentials(Token = token)) ]

                resultConfig.Contexts <-
                    [ Context
                        (Name = "cluster-context",
                         ContextDetails =
                             ContextDetails(Cluster = "cluster", User = this.ServiceAccount, Namespace = this.Namespace)) ]

                resultConfig.Clusters <- [ cluster ]
                resultConfig.CurrentContext <- "cluster-context"

                writeLines [ Plain
                                 ($@"KubeConfig for service account ""{this.ServiceAccount}"" in namespace ""{
                                                                                                                  this.Namespace
                                 }"":")
                             Plain(KubeConfig.toString resultConfig) ]

                return ReturnValues.success
            | None ->
                writeLine [ Color("No secret deploy token was found for this account.", Color.Red) ]
                return ReturnValues.failure
        }

    override this.GetCodeCompletions() =
        async {
            if String.IsNullOrWhiteSpace(this.Namespace)
            then return! Namespace.namespaceNames
            else if String.IsNullOrWhiteSpace(this.ServiceAccount)
            then return! getServiceAccounts this.Namespace
            else return Seq.empty<string>
        }

[<Command("kube-config",
          "kubeconfig",
          "kc",
          Description =
              "Create a kube-config at the given place with the given content. "
              + "The content is fetched from the passed argument OR the KUBE_CONFIG environment variable.")>]
[<Subcommand(typeof<Generate>)>]
type KubeConfig() =
    inherit BaseCommand()

    [<Argument(0, Name = "config-content", Description = "The content of the kube-config (text or base64).")>]
    member val Content = "" with get, set

    [<Option(CommandOptionType.NoValue, Description = "Forces the overwrite of any existing kube-config file.")>]
    member val Force = false with get, set

    [<Option(CommandOptionType.SingleValue, Description = "The path to the config file (default: ~/.kube/config).")>]
    member val Path = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".kube", "config") with get, set

    override this.Execute _ =
        async {
            let path =
                Path.GetFullPath
                    (if Path.IsPathRooted this.Path
                     then this.Path
                     else Path.Join(Directory.GetCurrentDirectory(), this.Path))

            if Directory.Exists path then
                writeLine [ Color("The given path is a directory.", Color.Red) ]
                return ReturnValues.failure
            else if String.IsNullOrWhiteSpace(this.Content)
                    && String.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("KUBE_CONFIG")) then
                writeLine [ Color("Neither content nor environment variable is set.", Color.Red) ]
                return ReturnValues.failure
            else if File.Exists(path)
                    && not this.Force
                    && not
                        (Prompt.GetYesNo($"Do you want to overwrite the config at {path}?", false, ConsoleColor.Yellow)) then
                return ReturnValues.success
            else
                let content =
                    if String.IsNullOrWhiteSpace this.Content
                    then Environment.GetEnvironmentVariable("KUBE_CONFIG")
                    else this.Content

                let valid, text = isValidBase64 content
                if valid then this.Content <- text

                File.WriteAllText(path, this.Content)

                return ReturnValues.success
        }
