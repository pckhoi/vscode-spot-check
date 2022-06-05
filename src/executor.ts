import { exec as unpromiseExec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(unpromiseExec);

// investigate alternate exec if regular exec does not work
// To get stdout, might need to use CustomExecution: https://code.visualstudio.com/api/extension-guides/task-provider#customexecution
// const alternateExec = () => {
// const workspaceFolder = vscode.workspace.getWorkspaceFolder(scriptUri);
// if (workspaceFolder === undefined) {
//   throw new Error(`script ${scriptUri.fsPath} is not under a workspace`);
// }

// const taskName = "List data files";
// const task = new vscode.Task(
//   { type: "shell", label: taskName, group: "preview" },
//   vscode.TaskScope.Workspace,
//   taskName,
//   scriptBasename,
//   new vscode.ShellExecution(
//     pythonPath,
//     [basename(scriptUri.fsPath), "dataFiles"],
//     {
//       cwd: dirname(scriptUri.fsPath),
//     }
//   )
// );
// task.presentationOptions.clear = true;
// task.presentationOptions.showReuseMessage = true;

// await vscode.tasks.executeTask(task);

// const result: number = await new Promise<number>((resolve) => {
//   let disposable: vscode.Disposable = vscode.tasks.onDidEndTaskProcess((e) => {
//     if (e.execution.task.name === taskName) {
//       disposable.dispose();
//       resolve(e.exitCode);
//     }
//   });
// });
// }

export const execute = async (command: string, ...args: string[]) => {
  const { stdout } = await exec(`${command} ${args.join(" ")}`);
  return stdout;
};
