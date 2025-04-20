export default async function handler(req, res) {
  const nodeVersion = process.version;
  return res.status(200).json({ message: "Server is alive", nodeVersion });
}
