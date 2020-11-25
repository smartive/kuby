namespace Kuby.Commands

open System
open System.ComponentModel.DataAnnotations
open System.Text
open McMaster.Extensions.CommandLineUtils
open Kuby.Clipboard

[<Command("encode", "enc", Description = "Encode some content to base64.")>]
type Encode() =
    inherit BaseCommand()

    [<Argument(0, Name = "content", Description = "The content to encode.")>]
    [<Required>]
    member val Content = "" with get, set

    [<Option(CommandOptionType.NoValue, Description = "When set, the content will not be copied into the clipboard.")>]
    member val NoCopy = false with get, set

    override this.Execute _ =
        async {
            let result =
                this.Content
                |> Encoding.UTF8.GetBytes
                |> Convert.ToBase64String

            printfn "Encoded content:"
            printfn "%s" result

            if not this.NoCopy
            then do! copy result

            return ReturnValues.success
        }

[<Command("decode", "dec", Description = "Decode some content from base64.")>]
type Decode() =
    inherit BaseCommand()

    [<Argument(0, Name = "content", Description = "The content to encode.")>]
    [<Required>]
    member val Content = "" with get, set

    [<Option(CommandOptionType.NoValue, Description = "When set, the content will not be copied into the clipboard.")>]
    member val NoCopy = false with get, set

    override this.Execute _ =
        async {
            let result =
                this.Content
                |> Convert.FromBase64String
                |> Encoding.UTF8.GetString

            printfn "Decoded content:"
            printfn "%s" result

            if not this.NoCopy
            then do! copy result

            return ReturnValues.success
        }

[<Command("base64", "b64", Description = "Utilities for base64 en-, decoding.")>]
[<Subcommand(typeof<Encode>, typeof<Decode>)>]
type Base64() =
    inherit BaseCommand()

    override this.Execute app =
        async {
            if not app.IsShowingInformation then app.ShowHelp() else ()
            return ReturnValues.success
        }
