namespace Kuby.Commands

open System
open Kuby.Commands.Deployment
open McMaster.Extensions.CommandLineUtils

[<Command("kuby", Description = "Kubernetes management and deployment helper.")>]
[<Subcommand(typeof<GetCompletions>,
             typeof<CompletionTemplate>,
             typeof<Namespace>,
             typeof<Context>,
             typeof<Base64>,
             typeof<KubeConfig>,
             typeof<Deployment>,
             typeof<Secret>,
             typeof<Kuby.Commands.Version>)>]
type Kuby() =
    inherit BaseCommand()

    override this.Execute app =
        async {
            if not app.IsShowingInformation then app.ShowHelp() else ()
            return ReturnValues.success
        }

and [<Command("get-completions", ShowInHelpText = false)>] GetCompletions() =
    inherit BaseCommand()

    let completionApp = new CommandLineApplication<Kuby>()

    do
        completionApp.Conventions.UseDefaultConventions()
        |> ignore

        completionApp.UnrecognizedArgumentHandling <- UnrecognizedArgumentHandling.CollectAndContinue

    [<Argument(0)>]
    member val Arguments = "" with get, set

    override this.Execute _ =
        async {
            let args = this.Arguments.Split ' '
            let parsed = completionApp.Parse args

            let rec isAssignable (givenType: Type) (genericType: Type) =
                if (givenType.IsGenericType
                    && givenType.GetGenericTypeDefinition() = genericType)
                   || Array.exists (fun (t: Type) ->
                       t.IsGenericType
                       && t.GetGenericTypeDefinition() = genericType) (givenType.GetInterfaces()) then
                    true
                else if givenType.BaseType = null then
                    false
                else
                    isAssignable givenType.BaseType genericType

            seq {
                let description (description: string) =
                    if description = null then "" else $":{description}"

                yield!
                    parsed.SelectedCommand.Options
                    |> Seq.filter (fun o ->
                        not (Array.contains $"--{o.LongName}" args)
                        && not (Array.contains $"--{o.ShortName}" args)
                        && not (Array.contains $"--{o.SymbolName}" args))
                    |> Seq.collect (fun o ->
                        seq {
                            yield $"--{o.LongName}{description o.Description}"
                            yield $"--{o.ShortName}{description o.Description}"
                            yield $"--{o.SymbolName}{description o.Description}"
                        })

                yield!
                    parsed.SelectedCommand.Commands
                    |> Seq.filter (fun o -> o.ShowInHelpText)
                    |> Seq.collect (fun o -> o.Names |> Seq.map (fun n -> (n, o.Description)))
                    |> Seq.filter (fun (name, _) -> not <| Array.contains name args)
                    |> Seq.map (fun (name, desc) -> $"{name}{description desc}")

                if isAssignable (parsed.SelectedCommand.GetType()) typedefof<CommandLineApplication<_>> then
                    let baseCommand =
                        parsed
                            .SelectedCommand
                            .GetType()
                            .GetProperty("Model")
                            .GetValue(parsed.SelectedCommand) :?> BaseCommand

                    yield!
                        baseCommand.GetCodeCompletions()
                        |> Async.RunSynchronously
            }
            |> Seq.iter (printfn "%s")

            return ReturnValues.success
        }
