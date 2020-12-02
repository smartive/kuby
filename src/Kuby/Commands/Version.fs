namespace Kuby.Commands

open System.Reflection
open DotnetKubernetesClient
open Kuby
open Kuby.ConsoleWriter
open Kuby.Kubernetes
open McMaster.Extensions.CommandLineUtils

[<Command("version", "ver", "v", Description = "Show the version information of the current cluster.")>]
type Version() =
    inherit BaseCommand()

    override this.Execute _ =
        async {
            let client = KubernetesClient()

            let server =
                client.GetServerVersion()
                |> Async.AwaitTask
                |> Async.RunSynchronously

            let assemblyAttribute =
                Assembly
                    .GetExecutingAssembly()
                    .GetCustomAttribute<AssemblyInformationalVersionAttribute>()

            let assembly =
                if assemblyAttribute = null then "No explicit version." else assemblyAttribute.InformationalVersion

            writeLines [ Plain($"Kuby: v{assembly}")
                         Plain($"Kubectl: {Kubectl.version}")
                         Plain($"Current Server ({Cluster.currentClusterName}): v{server.Major}.{server.Minor}")
                         Plain($"Current Namespace: {Namespace.printableCurrentNamespace}") ]

            return ReturnValues.success
        }
