namespace Kuby.Commands

open System
open McMaster.Extensions.CommandLineUtils

module private Templates =
    // https://iridakos.com/programming/2018/03/01/bash-programmable-completion-tutorial
//    let bash =
//        String.Format
//            (@"
//###-begin-{0}-completions-###
//#
//# {0} command completion script
//#
//# Installation: {0} completion --shell bash >> ~/.bashrc
//#    or {0} completion --shell bash >> ~/.bash_profile on OSX.
//#
//_{0}_completions()
//{{
//    local cur_word args type_list
//    cur_word=""${{COMP_WORDS[COMP_CWORD]}}""
//    args=(""${{COMP_WORDS[@]}}"")
//
//    type_list=$({0} get-completions ""${{args[@]}}"")
//    COMPREPLY=( $(compgen -W ""${{type_list}}"" -- ${{cur_word}}) )
//
//    # if no match was found, fall back to filename completion
//    if [ ${{#COMPREPLY[@]}} -eq 0 ]; then
//      COMPREPLY=()
//    fi
//    return 0
//}}
//complete -o default -F _{0}_completions {0}
//###-end-{0}-completions-###
//", "kuby")

    let zsh =
        String.Format
            (@"
###-begin-{0}-completions-###
#
# {0} command completion script
#
# Installation: {0} completion --shell zsh >> ~/.zshrc
#    or {0} completion --shell zsh >> ~/.zsh_profile on OSX.
#
_{0}_completions()
{{
  local reply
  local si=$IFS
  IFS=$'\n' reply=($({0} get-completions ""$BUFFER""))
  IFS=$si
  _describe 'values' reply
}}
compdef _{0}_completions {0}
###-end-{0}-completions-###
",
             "kuby")

type ShellType =
    //| Bash = 0
    | Zsh = 1

[<Command("completion",
          Description = "Generate a zsh shell completion script.",
          ExtendedHelpText =
              "Use this to add the completion script to your shell startup (e.g. kuby completion >> ~/.zshrc).")>]
type CompletionTemplate() =
    inherit BaseCommand()

//    [<Option(CommandOptionType.SingleValue, Description = "The specific type of shell (zsh or bash) [default: bash]")>]
//    member val Shell = ShellType.Zsh with get, set

    override this.Execute _ =
        async {
//            match this.Shell with
////            | ShellType.Bash -> printf "%s" Templates.bash
//            | ShellType.Zsh -> printf "%s" Templates.zsh
//            | _ -> failwith "The provided shell value is not valid."

            printf "%s" Templates.zsh
            return ReturnValues.success
        }
