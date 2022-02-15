use colored::Colorize;
use dialoguer::Select;
use dialoguer::theme::ColorfulTheme;

use crate::kubeconfig::{load, save};

pub async fn context(name: &Option<String>) -> Result<(), Box<dyn std::error::Error>> {
    let mut config = load()?;
    let contexts: Vec<String> = config.contexts.iter().map(|c| c.name.to_string()).collect();
    let current_context = config.current_context.unwrap_or_else(|| "".to_string());

    let new_context = match name {
        Some(name) => name.to_string(),
        None => {
            let selected = Select::with_theme(&ColorfulTheme::default())
                .with_prompt(format!("Select new context (current: {})", current_context.green()))
                .default(0)
                .items(&contexts)
                .interact()?;
            contexts.get(selected).unwrap_or(&"".to_string()).to_string()
        }
    };

    if current_context == *new_context {
        println!("{} is already set as context.", current_context.green());
        return Ok(());
    }

    println!("Set {} as active context.", new_context.green());
    config.current_context = Some(new_context);
    save(&config)?;

    Ok(())
}
