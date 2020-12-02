namespace Kuby.Commands

open Kuby.ConsoleWriter
open Kuby.Kubernetes
open McMaster.Extensions.CommandLineUtils
open Sharprompt

[<Command("context", "ctx", Description = "Switch the current context to another one.")>]
type Context() =
    inherit BaseCommand()

    [<Argument(0, Name = "context", Description = "The new context to switch to.")>]
    member val NewContext = "" with get, set

    override this.Execute _ =
        async {
            if this.NewContext <> ""
               && Context.printableCurrentContextName = this.NewContext then
                return ReturnValues.success
            else
                if this.NewContext = "" then
                    writeLine [ Plain("The current context is: ")
                                Color(Context.printableCurrentContextName, Color.Yellow) ]
                    this.NewContext <-
                        Prompt.Select($"Select new context (arrows for nav, type for search)", Context.contextNames, 5)

                writeLine [ Plain("Switch current context to: ")
                            Color(this.NewContext, Color.Cyan) ]

                KubeConfig.update (fun c -> c.CurrentContext <- this.NewContext)

                return ReturnValues.success
        }

    override this.GetCodeCompletions() = async { return Context.contextNames }
