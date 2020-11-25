namespace Kuby.Commands.Deployment

open System
open System.ComponentModel.DataAnnotations
open System.Text
open Kuby.ConsoleWriter
open Kuby.Commands
open McMaster.Extensions.CommandLineUtils
open YamlDotNet.Core
open YamlDotNet.Serialization
open YamlDotNet.Serialization.NamingConventions
open k8s.Models

type private Base64Converter() =
    interface IYamlTypeConverter with
        member this.Accepts t = t = typeof<byte []>

        member this.ReadYaml(parser, t) =
            let scalar =
                parser.Current :?> YamlDotNet.Core.Events.Scalar

            let bytes = Convert.FromBase64String scalar.Value
            parser.MoveNext() |> ignore
            bytes :> obj

        member this.WriteYaml(emitter, value, _) =
            let bytes = value :?> byte []

            emitter.Emit
                (YamlDotNet.Core.Events.Scalar(null, null, Convert.ToBase64String bytes, ScalarStyle.Plain, true, false))


[<Command("create", "c", Description = "Create a secret with the given data and print it to stdout.")>]
type Create() =
    inherit BaseCommand()

    let serializer =
        SerializerBuilder()
            .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitDefaults)
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .WithTypeConverter(Base64Converter())
            .Build()

    [<Argument(0, Description = "The name of the secret.")>]
    [<Required>]
    member val Name = "" with get, set

    [<Argument(1, Description = "The data (array) of the secret in the form of: key=value key=value key=value.")>]
    member val Data = [| "" |] with get, set

    override this.Execute _ =
        async {
            let data =
                this.Data
                |> Array.map (fun d -> d.Split '=' |> List.ofArray)
                |> Array.map (fun d ->
                    match d with
                    | name :: values -> Some(name, String.Join('=', values) |> Encoding.UTF8.GetBytes)
                    | _ -> None)
                |> Array.choose id
                |> dict

            let secret =
                V1Secret
                    (ApiVersion = V1Secret.KubeApiVersion,
                     Kind = V1Secret.KubeKind,
                     Type = "opaque",
                     Metadata = V1ObjectMeta(Name = this.Name),
                     Data = data)

            writeLines [ Plain("Resulting secret:")
                         Plain(serializer.Serialize secret) ]

            return ReturnValues.success
        }

[<Command("docker-registry", "docker", "d", Description = "Create a docker registry secret and print it to stdout.")>]
type DockerSecret() =
    inherit BaseCommand()

    [<Argument(0, Description = "The name of the secret.")>]
    [<Required>]
    member val Name = "" with get, set

    [<Option(CommandOptionType.SingleValue, Description = "Docker registry username.")>]
    member val Username = "" with get, set

    [<Option(CommandOptionType.SingleValue, Description = "Docker registry password.")>]
    member val Password = "" with get, set

    [<Option(CommandOptionType.SingleValue,
             Description = "Docker registry server (default: https://index.docker.io/v1/).")>]
    member val Server = "https://index.docker.io/v1/" with get, set

    [<Option(CommandOptionType.SingleValue, Description = "Docker registry email.")>]
    member val Email = "" with get, set

    override this.Execute app =
        async {
            while String.IsNullOrWhiteSpace this.Username do
                this.Username <- Prompt.GetString "Enter the username for the registry:"

            while String.IsNullOrWhiteSpace this.Password do
                this.Password <- Prompt.GetPassword "Enter the password for the registry:"

            while String.IsNullOrWhiteSpace this.Email do
                this.Email <- Prompt.GetString "Enter the email for the registry:"

            while String.IsNullOrWhiteSpace this.Server do
                this.Server <- Prompt.GetString "Enter the server for the registry:"

            let auth =
                $"{this.Username}:{this.Password}"
                |> Encoding.UTF8.GetBytes
                |> Convert.ToBase64String

            let cfg =
                $@"{{""auths"":{{""{this.Server}"":{{""username"":""{this.Username}"",""password"":""{this.Password}"",""email"":""{
                                                                                                                                        this.Email
                }"",""auth"":""{auth}""}}}}}}"

            let creator = Create()
            creator.Name <- this.Name
            creator.Data <- [|$".dockerconfigjson={cfg}"|]

            do! creator.Execute(app) |> Async.Ignore

            return ReturnValues.success
        }

[<Command("secret", Description = "Utilities for kubernetes secrets.")>]
[<Subcommand(typeof<Create>, typeof<DockerSecret>)>]
type Secret() =
    inherit BaseCommand()

    override this.Execute app =
        async {
            if not app.IsShowingInformation then app.ShowHelp() else ()
            return ReturnValues.success
        }
