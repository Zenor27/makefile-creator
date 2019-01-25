import * as vscode from 'vscode';
import * as fs from 'fs';

function get_flags(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration) {
	let cxx = "CXX = " + config.makefile_cxx;
	let cxxflags = "CXXFLAGS = " + config.makefile_cxxflags;
	if (config.makefile_use_asan) {
		cxxflags += " -fsanitize=address";
	}
	let ldflags = "LDFLAGS = " + config.makefile_ldflags;
	if (config.makefile_use_asan) {
		ldflags += " -fsanitize=address";
	}
	var flags = "";

	flags += cxx + '\n';
	flags += cxxflags + '\n';
	flags += ldflags + '\n';

	return flags;
}

function get_source_files(context: vscode.ExtensionContext, uri:vscode.Uri) {
	var source_files = "";
	var re = /(?:\.([^.]+))?$/;

	var dir = fs.readdirSync(uri.fsPath);
		dir.forEach(file => {
			var regex_res = re.exec(file.toString());
			if (regex_res != null)
			{
				var ext = regex_res[1];
				if (ext == "cc")
				{
					source_files += file.toString() + " ";
				}
			}
		});

	return source_files.substring(0, source_files.length-1);
}

function get_executable_name(value: string) {
	var exec = "EXEC = ";
	exec += value + '\n';
	return exec;
}

function get_core()	{
	var core = "";
	core += "all: $(EXEC)\n\n"
	core += "$(EXEC): $(OBJ)\n"
	core += "\t$(CXX) $(LDFLAGS) -o $@ $(OBJ) $(LBLIBS)\n\n"
	core += "clean:\n"
	core += "\trm -rf $(OBJ) $(EXEC)";
	return core;
}

function create_makefile(context: vscode.ExtensionContext, uri: vscode.Uri) {
	vscode.window.showInformationMessage('Creating Makefile...');
	let config = vscode.workspace.getConfiguration("makefile-creator");
	var makefile = "";

	makefile += get_flags(context, config);
	makefile += '\n';
	makefile += "SRC = " + get_source_files(context, uri) + '\n';
	makefile += "OBJ = $(SRC:.cc=.o)\n";

	let options: vscode.InputBoxOptions = {
		prompt: "Name of executable: ",
		placeHolder: "main"
	}
	vscode.window.showInputBox(options).then(value => {
		if (!value) {
			value = "main";
		}
		makefile += get_executable_name(value);
		makefile += '\n';
		makefile += get_core();
		let path = uri.fsPath + '/Makefile';
		fs.writeFile(path, makefile, function(err) {
			if (err) {
				throw err;
			}
			console.log('Makefile created!');
		});
	});
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Makefile-Creator extension is loaded.');

	let disposable = vscode.commands.registerCommand('extension.makefile-creator', (uri:vscode.Uri) => {
		create_makefile(context, uri);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
