open Kuby.Commands
open McMaster.Extensions.CommandLineUtils

[<EntryPoint>]
let main argv =
    CommandLineApplication.ExecuteAsync<Kuby> argv
    |> Async.AwaitTask
    |> Async.RunSynchronously
