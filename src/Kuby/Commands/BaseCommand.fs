namespace Kuby.Commands

open System.Threading.Tasks
open McMaster.Extensions.CommandLineUtils

[<AbstractClass>]
type BaseCommand() =
    member this.OnExecuteAsync app: Task<int> = this.Execute app |> Async.StartAsTask

    abstract Execute: CommandLineApplication -> Async<int>
    abstract GetCodeCompletions: unit -> Async<string seq>
    default this.GetCodeCompletions() = async { return Seq.empty<string> }
