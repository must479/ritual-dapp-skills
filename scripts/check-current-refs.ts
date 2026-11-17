#!/usr/bin/env bun

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const root = join(import.meta.dir, "..");
const ignored = new Set([".git", "node_modules"]);
const textExtensions = new Set([".html", ".json", ".md", ".py", ".sh", ".sol", ".svg", ".tmpl", ".ts", ".tsx"]);

const stale = [
  /\b(?:PER_SINK_ECIES|FANOUT_USER_ECIES|CONTRACT_OUTPUT_UTF8|verifyPrivateStreamArchive|decodeStreamReceipt|encodeRequestPerSink)\b/,
  /SovereignAgentFactory|PersistentAgentFactory|SovereignAgentHarness|PersistentAgentLauncher/,
  /SOVEREIGN_FACTORY|PERSISTENT_FACTORY|Factory-Only Agent Deployment/,
  /0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC/i,
  /0x663F3ad617193148711d28f5334eE4Ed07016602/i,
  /requestPredicted(?:Harness|Launcher)DkmsExtraction|predictCompressed(?:Harness|Launcher)|CREATE3/,

  /0x8Df72C162ED31cD7c2dff426e175AB218f84d9b5/i,
  /0xd0e9fD0762774064AEC7D8519f9734e0D4304E29/i,
  /0x70b0a57b292f7E85EA4Fda46710Fd2EE1082481C/i,
  /0x9Ffd152dA8a6736E823696CA40f234fD13785147/i,
  /0xEaD26B69062d6707123aD2Bd525b92Cf1e4036e2/i,
  /0xa5a40E2559e66b2E42Ce8F54d6d5A65728da4222/i,
  /0x2D815240A61731c75Fa01b2793E1D3eD09F289d0/i,
  /0x1A8b1f37eC44dfcD8A0E2b70B0917D24D52A7941/i,
  /0x487a8BFdF099d92016c610EAc6D42Fcd80f60634/i,
  /0xcb34CD284732bb7A8dadA17C10f21171EaBbAfEF/i,
  /0xD561cFdea52CF507b4667Da6Aaa5996F10217025/i,
  /\b1979\b/,
  /0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948/i,
  /0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5/i,
  /0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F/i,
  /0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B/i,
  /0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD/i,
  /0x5A16214fF555848411544b005f7Ac063742f39F6/i,
  /0x7A85F48b971ceBb75491b61abe279728F4c4384f/i,
  /0x28BC6D432Daed0ed15154E9AD8CB54336675984D/i,
  /0xEF505E801f1Db392B5289690E2ffc20e840A3aCa/i,
  /0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304/i,
  /0xD4AA9D55215dc8149Af57605e70921Ea16b73591/i,
  /0x2a67f8912C1ac102181AC27427e2Ddc8Ebdce7f7/i,
  /0x37570bcE311e2A661A752C4C35DB821221261045/i,
  /0x91E35FC95e40E8606Aa400762019e3613D4C8FC7/i,
  /0x5577Ea679673Ec7508E9524100a188E7600202a3/i,
  /0xB5be119daDF78508Fd006D341b300AF3E9329eA7/i,
  /0xB59141Bc/i,
  /Ritual Chain is a testnet/i,
  /Genesis V2/i,
  /shadownet/i,
  /chain[ -]781/i,
  /All RITUAL tokens are free/i,
  /contracts:\s*\{\s*multicall3/i,
];

const historicalAllowlist = new Set([
  "scripts/check-current-refs.ts",
]);
const failures: string[] = [];

async function walk(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (!textExtensions.has(extension)) continue;
    const rel = relative(root, path);
    if (historicalAllowlist.has(rel)) continue;
    const lines = (await Bun.file(path).text()).split("\n");
    lines.forEach((line, index) => {
      for (const pattern of stale) {
        if (pattern.test(line)) failures.push(`${rel}:${index + 1}: ${pattern}`);
      }
    });
  }
}

await walk(root);

const required: Array<[string, RegExp]> = [
  ["skills/ritual-dapp-deploy/SKILL.md", /Agent Consumer Preflight/],
  ["examples/sovereign-agent/SovereignAgentConsumer.sol", /function callSovereignAgent\(bytes calldata input\)/],
  ["examples/persistent-agent/PersistentAgentConsumer.sol", /function callPersistentAgent\(uint256 agentId, uint64 revision, bytes calldata input\)/],
  ["examples/sovereign-agent/run.sh", /ASYNC_DELIVERY_ADDRESS/],
  ["examples/persistent-agent/run.sh", /ASYNC_DELIVERY_ADDRESS/],
  ["skills/ritual-dapp-agents/SKILL.md", /Direct Consumer Deployment/],
  ["skills/ritual-dapp-agents/SKILL.md", /13-field `AgentAsyncEnvelope`/],
  ["skills/ritual-dapp-secrets/SKILL.md", /Immediate EVM caller of the async precompile/],
  ["skills/ritual-dapp-secrets/SKILL.md", /grantAccess` writes under `msg\.sender`/],
  ["skills/ritual-dapp-deploy/SKILL.md", /Deployment discovery is mandatory/],
  ["skills/ritual-dapp-http/references/rithttp1.md", /body = "RITHTTP1" \|\| abi\.encode/],
  ["skills/ritual-dapp-http/references/rithttp1.md", /"messages": \{"\$ritual_da": 0\}/],
  ["skills/ritual-dapp-http/references/rithttp1.md", /at most 8 input refs, 6 output pipes, 1 STREAM and 4 DA/],
  ["skills/ritual-dapp-http/references/rithttp1.md", /DA expansion is one level only/],
  ["skills/ritual-dapp-http/references/rithttp1.md", /OutputPipe\[\] outputs/],
  ["skills/ritual-dapp-http/references/rithttp1-private-io.md", /recipient key ID is `keccak256/],
  ["skills/ritual-dapp-http/references/rithttp1-private-io.md", /`InputRef` digest covers uploaded ciphertext/],
  ["skills/ritual-dapp-http/references/rithttp1-private-io.md", /Verify settlement before accepting output/],
  ["skills/ritual-dapp-http/references/rithttp1.md", /contractEncoding = 4/],
  ["skills/ritual-dapp-http/references/rithttp1-private-io.md", /RITPIPE1/],
  ["skills/ritual-dapp-http/SKILL.md", /references\/rithttp1-private-io\.md/],
  ["skills/ritual-dapp-longrunning/SKILL.md", /AWAIT_RESPONSE \\?\| STREAM_RESPONSE/],
  ["skills/ritual-dapp-secrets/SKILL.md", /RITHTTP1 post-hydration secrets/],
  ["skills/ritual-dapp-secrets/SKILL.md", /RITHTTP1 encrypted DA artifacts/],
  ["skills/ritual-dapp-testing/SKILL.md", /RITHTTP1 protocol matrix/],
];

for (const [rel, pattern] of required) {
  const content = await Bun.file(join(root, rel)).text();
  if (!pattern.test(content)) failures.push(`${rel}: missing required current-model assertion ${pattern}`);
}

if (failures.length > 0) {
  console.error(`Current-reference check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Current-reference check passed: chain, contract, agent-envelope, secret-role, RITHTTP1 public/private I/O, and deployment-authority assertions are consistent.");
