module Kuby.ConsoleWriter

open System

type Color = ConsoleColor

type Output =
    | Plain of string
    | Color of string * Color

let private write (output: Output seq) (writer: string -> unit) =
    output
    |> Seq.iter (fun o ->
        match o with
        | Plain (s) -> writer s
        | Color (s, c) ->
            Console.ForegroundColor <- c
            writer s
            Console.ResetColor())

let writeLine (output: Output seq) =
    write output Console.Write
    Console.Write Environment.NewLine

let writeLines (output: Output seq) =
    write output Console.WriteLine
