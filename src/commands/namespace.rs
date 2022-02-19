use colored::Colorize;
use dialoguer::theme::ColorfulTheme;
use dialoguer::Select;
use k8s_openapi::api::core::v1::Namespace;
use kube::api::ListParams;
use kube::{Api, Client};

use crate::kubeconfig::{load, save};

pub async fn namespace(name: &Option<String>) -> Result<(), Box<dyn std::error::Error>> {
    let mut config = load()?;
    let default_context = "".to_string();
    let current_context_name = config.current_context.as_ref().unwrap_or(&default_context);
    let current_namespace = config
        .contexts
        .iter()
        .find(|&ctx| ctx.name == *current_context_name)
        .expect("No context with name found.")
        .clone()
        .context
        .namespace
        .unwrap_or_else(|| "default".to_string());

    let new_namespace = match name {
        Some(name) => name.to_string(),
        None => {
            let client = Client::try_default().await?;
            let namespaces: Api<Namespace> = Api::all(client);
            let mut namespace_names = Vec::new();

            for ns in namespaces.list(&ListParams::default()).await? {
                match ns.metadata.name {
                    None => continue,
                    Some(name) => namespace_names.push(name),
                }
            }

            let selected = Select::with_theme(&ColorfulTheme::default())
                .with_prompt(format!(
                    "Select new namespace (current: {})",
                    current_namespace.green()
                ))
                .default(0)
                .items(&namespace_names)
                .interact()?;
            namespace_names
                .get(selected)
                .unwrap_or(&"".to_string())
                .to_string()
        }
    };

    if current_namespace == new_namespace {
        println!("{} is already set as namespace.", current_namespace.green());
        return Ok(());
    }

    println!("Set {} as active namespace.", new_namespace.green());

    let mut new_contexts = Vec::new();
    for mut ctx in config.contexts {
        if ctx.name != *current_context_name {
            new_contexts.push(ctx);
            continue;
        }

        ctx.context.namespace = Some(new_namespace.to_string());
        new_contexts.push(ctx);
    }

    config.contexts = new_contexts;
    save(&config)?;

    Ok(())
}
