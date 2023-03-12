import { PluginSettingTab, Plugin, SettingTab, Setting, App, TextComponent, PluginManifest } from 'obsidian';

import InsertChemicalDrawingModal from './modals/InsertChemicalDrawingModal';
import mergeObjects from 'lodash.merge';

import { 
  svgFromFormula, 
  svgFromIUPAC, 
  svgFromSmiles, 
  wrapWithBox 
} from './util';
import { 
  AppSettingTab,
  PluginSettings,
  SettingsFactory
} from './settings';

const DEFAULT_SETTINGS: PluginSettings = {
  inputMode: 'SMILES',
	container: {
    padding: 10
  },
  svg: {
    autoCrop: false,
    height: 100,
    width: 100
  },
  showOptions: true,
  showPreview: true
}

export default class ChemLabPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;
  settingsFactory: SettingsFactory;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    this.settingsFactory = new SettingsFactory(this);
  }
  /** generates the chemical structure as an SVG */
  static async generateSVG(input: string, inputMode: PluginSettings['inputMode'], svgOptions?: PluginSettings['svg']) {
    switch(inputMode) {
      case 'SMILES': return svgFromSmiles(input, svgOptions);
      case 'FORMULA': return svgFromFormula(input, svgOptions);
      case 'IUPAC': return svgFromIUPAC(input, svgOptions);
    }
    throw new Error('input mode argument is invalid');
  }
  
  /** runs when the plugin is loaded by Obsidian */
  async onload() {
   	await this.loadSettings()
    this.addSettingTab(new AppSettingTab(this.app, this));
    this.addCommands();
	}

  /** runs when Obsidian unloads the plugin */
	onunload() { /* noop */ }

	async loadSettings() {
    this.settings = mergeObjects({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

  async resetSettings() {
    await this.saveData(DEFAULT_SETTINGS);
    await this.loadSettings();
  }
  
  private addCommands() {
    this.addInsertSVGCommand();
  }

  private addInsertSVGCommand() {
    this.addCommand({
			id: 'open-insert-chemical-drawing-modal',
			name: 'insert chemical structure',
			editorCallback: (editor) => {
      
        // open the chemical drawing modal
				const modal = new InsertChemicalDrawingModal(this);

        // handle when the user wants to insert the SVG
        const onSubmitHandler = async (input: string) => {
          const svg = await ChemLabPlugin.generateSVG(input, this.settings.inputMode, this.settings.svg);
          const wrappedSVG = wrapWithBox(svg);
          editor.replaceSelection(wrappedSVG  + '\n');    
        }

        modal.onSubmit(onSubmitHandler)

        modal.open();
			}
		});
  }

}
