module Kuby.Strings

open System
open System.Text

let isValidBase64 (string: string) =
    let buffer =
        Span<byte>(Array.create<byte> string.Length 0uy)

    let isBase64, converted =
        Convert.TryFromBase64String(string, buffer)

    let result =
        Encoding.UTF8.GetString(buffer.ToArray(), 0, converted)

    let test =
        Convert.ToBase64String(Encoding.UTF8.GetBytes(result))

    isBase64 && string = test, result

let rec trimStart (pattern: string) (string: string) =
    if String.IsNullOrWhiteSpace pattern then string
    else if string.StartsWith pattern then trimStart pattern (string.Substring pattern.Length)
    else string
