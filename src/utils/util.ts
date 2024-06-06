export function parseResult(str: string) {
  // Trim the input string to remove leading/trailing whitespace and newlines
  str = str.trim();

  // Extract the status (won or lost)
  let status = str.includes("won") ? "won" : "lost";

  // Extract the main number and the leading/trailing number with sign
  let matches = str.match(/(\d+)\s*\(\s*([+-])\s*(\d+)\s*\)/);

  if (!matches) {
    throw new Error("String format is incorrect");
  }

  let total = parseInt(matches[1], 10);
  let sign = matches[2];
  let number = parseInt(matches[3], 10);

  // Create the response object based on the status
  let response = {
    total: total,
    diff: number,
    sign: sign,
  };

  return response;
}
