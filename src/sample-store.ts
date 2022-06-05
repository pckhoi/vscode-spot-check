import * as vscode from "vscode";
import { tmpdir } from "node:os";
import path from "node:path";
import ScriptHandler from "./script-handler";
import { StringDecoder } from "node:string_decoder";

const APP_PREFIX = "vscode-spot-check";

const samplesDirPath = (spotCheckScriptPath: string) =>
  path.join(
    tmpdir(),
    APP_PREFIX,
    spotCheckScriptPath.startsWith("/")
      ? path.dirname(spotCheckScriptPath).slice(1)
      : path.dirname(spotCheckScriptPath)
  );

export const nextSample = async (
  spotCheckScriptPath: string
): Promise<Sample> => {
  const script = await ScriptHandler.fromScriptUri(
    vscode.Uri.file(spotCheckScriptPath)
  );

  // ensure that samples dir exists
  const samplesDir = vscode.Uri.file(samplesDirPath(spotCheckScriptPath));
  const samplesDirStat = await vscode.workspace.fs.stat(samplesDir);
  if (samplesDirStat.type & vscode.FileType.Directory) {
    await vscode.workspace.fs.createDirectory(samplesDir);
  }

  const files = (await vscode.workspace.fs.readDirectory(samplesDir))
    .filter(
      ([name, type]) => type & vscode.FileType.File && name.endsWith(".json")
    )
    .map(([name, type]) => name);
  if (files.length > 0) {
    const fileUri = vscode.Uri.file(files[0]);
    const fileStat = await vscode.workspace.fs.stat(fileUri);
    // if script and data files are older than temporary sample file,
    // delete the sample file and return its content
    if (script.maxModTime() < fileStat.mtime) {
      const decoder = new StringDecoder("utf8");
      const data = JSON.parse(
        decoder.write(Buffer.from(await vscode.workspace.fs.readFile(fileUri)))
      );
      await vscode.workspace.fs.delete(fileUri);
      return data;
    } else {
      // otherwise, remove all sample files because they are stale
      await Promise.all(
        files.map((file) => vscode.workspace.fs.delete(vscode.Uri.file(file)))
      );
    }
  }

  // generate new samples, return the first one, store the rest
  const newSamples = await script.generateSamples();
  await Promise.all(
    newSamples
      .slice(1)
      .map((file, ind) =>
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${ind + 1}.json`),
          Buffer.from(JSON.stringify(file))
        )
      )
  );
  return newSamples[0];
};
