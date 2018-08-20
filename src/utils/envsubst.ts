export function envsubst(content: string): string {
  const regex = /\$(?:(\w+)|{(\w+)})/g;

  return content.replace(regex, (original, g1: string, g2: string) => {
    const variable = g1 || g2;

    return process.env.hasOwnProperty(variable)
      ? process.env[variable]!
      : original;
  });
}
