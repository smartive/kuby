namespace Kuby.Commands

open Kuby.ConsoleWriter
open Kuby.Kubernetes
open McMaster.Extensions.CommandLineUtils
open Sharprompt

[<Command("namespace", "ns", Description = "Switch the current namespace to another one.")>]
type Namespace() =
    inherit BaseCommand()

    [<Argument(0, Name = "namespace", Description = "The new namespace to switch to.")>]
    member val NewNamespace = "" with get, set

    override this.Execute _ =
        async {
            writeLine [ Plain("The current namespace is: ")
                        Color(Namespace.printableCurrentNamespace, Color.Yellow) ]

            if this.NewNamespace = "" then
                let! namespaces = Namespace.namespaceNames

                this.NewNamespace <-
                    Prompt.Select($"Select new namespace (arrows for nav, type for search)", namespaces, 5)

            writeLine [ Plain("Switch current namespace to: ")
                        Color(this.NewNamespace, Color.Cyan) ]

            KubeConfig.update (fun c ->
                match c.Contexts
                      |> Seq.tryFind (fun ctx -> ctx.Name = c.CurrentContext) with
                | Some (ctx) -> ctx.ContextDetails.Namespace <- this.NewNamespace
                | _ -> ())

            return ReturnValues.success
        }

    override this.GetCodeCompletions() = Namespace.namespaceNames
