import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {ExampleModal} from './model';
import {TextGeneratorSettings} from './types';
import {appPencile_icon, pencil_icon} from './icons';
import TextGeneratorSettingTab from './ui/settingsPage';
import TextGenerator from './textGenerator';

const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
	engine: "text-davinci-002",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: "",
	showStatusBar: true
}

export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	statusBarItemEl: any;
	textGenerator:TextGenerator;
	
    updateStatusBar(text: string) {
        let text2 = "";
        if (text.length > 0) {
            text2 = `: ${text}`;
        }
    
        if (this.settings.showStatusBar) {
            this.statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens})${text2}`);
        }
    }

	getActiveView() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView !== null) {
            return activeView
        } else {
            new Notice("The file type should be Markdown!");
            return null
        }
    }

	async onload() {
		addIcon("pencil_icon",pencil_icon);
		addIcon("appPencile_icon",appPencile_icon);

		this.textGenerator=new TextGenerator(this.app,this);
		
		await this.loadSettings();
		
		this.statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('pencil_icon', 'Generate Text!', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const activeFile = this.app.workspace.getActiveFile();
			this.updateStatusBar(`processing... `);
			const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			try {
				await this.textGenerator.generateInEditor(this.settings,false,editor);
				this.updateStatusBar(``);
			} catch (error) {
				new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
				this.updateStatusBar(`Error: Check Console`);
				setTimeout(()=>this.updateStatusBar(``),3000);
			}
			}


		});

		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			icon: 'pencil_icon',
			hotkeys: [{ modifiers: ["Ctrl"], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				try {
					await this.textGenerator.generateInEditor(this.settings,false,editor);
					this.updateStatusBar(``);
				} catch (error) {
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});

		this.addCommand({
			id: 'generate-text-From-template',
			name: 'Generate Text From Template',
			icon: 'pencil_icon',
			hotkeys: [{ modifiers: ["Ctrl",'Shift'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				try {
					new ExampleModal(this.app, async (result) => {
						await this.textGenerator.generateFromTemplate(this.settings,result.path,false,editor);
					  }).open();

					this.updateStatusBar(``);
				} catch (error) {
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});


		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			icon: 'appPencile_icon',
			hotkeys: [{ modifiers: ["Ctrl",'Alt'], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				try {
					await this.textGenerator.generateInEditor(this.settings,true,editor);
					this.updateStatusBar(``);
				} catch (error) {
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});

		this.addCommand({
			id: 'increase-max_tokens',
			name: 'Increase max_tokens by 10',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "1" }],
			editorCallback: async () => {
				this.settings.max_tokens += 10;
				await this.saveSettings();
				this.updateStatusBar('');
			}
		});

		this.addCommand({
			id: 'decrease-max_tokens',
			name: 'decrease max_tokens by 10',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "2" }],
			editorCallback: async () => {
				this.settings.max_tokens -= 10;
				await this.saveSettings();
				this.updateStatusBar('');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TextGeneratorSettingTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}