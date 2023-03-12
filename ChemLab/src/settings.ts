import { PluginSettingTab, Plugin, SettingTab, Setting, App, TextComponent, DropdownComponent, ToggleComponent, ButtonComponent } from 'obsidian';
import ChemDrawSvgPlugin from './main';
import { InputModeTypes } from './consts';
import * as CSS from 'csstype';

import { Labels } from './consts';
import merge from 'lodash.merge';

const SettingLabels = Labels.settings;

export interface PluginSettings {
  inputMode: InputModeTypes;
  container: {
    padding: number
  },
  svg: {
    autoCrop: boolean,
    height: number,
    width: number
  },
  showPreview: boolean;
  showOptions: boolean;
}

export class AppSettingTab extends PluginSettingTab {
  plugin: ChemDrawSvgPlugin;
  factory: SettingsFactory;

  constructor(app: App, plugin: ChemDrawSvgPlugin) {
		super(app, plugin);
		this.plugin = plugin;
    this.factory = plugin.settingsFactory;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Chemical Drawing SVG Settings'});

    const inputModeSetting = new Setting(containerEl);
    inputModeSetting.setName('Input Mode');
    inputModeSetting.setDesc('Sets whether the chemical structure input is using SMILES notation, IUPAC nomenclature, or is a chemical formula.');
    const inputModeDropdown = this.factory.createInputModeDropdown(inputModeSetting.controlEl);

    const autoCropSetting = new Setting(containerEl);
    autoCropSetting.setName('Auto Crop');
    autoCropSetting.setDesc('If toggled, the SVG will be automatically cropped to fit the molecule.');
    const autoCropToggle = this.factory.createAutoCropToggle(autoCropSetting.controlEl);

		const heightSetting = new Setting(containerEl);
		heightSetting.setName('Height');
		heightSetting.setDesc('The height of the SVG (does not include padding)');
    const heightInput = this.factory.createHeightInput(heightSetting.controlEl);

    const widthSetting = new Setting(containerEl);
		widthSetting.setName('Width')
		widthSetting.setDesc('The width of the SVG (does not include padding)')
    const widthInput = this.factory.createWidthInput(widthSetting.controlEl);

    const showOptionsSetting = new Setting(containerEl);
    showOptionsSetting.setName('Show Options');
    showOptionsSetting.setDesc('Will display an options panel in the insertion dialog/modal');
    const showOptionsToggle = this.factory.createShowOptionsToggle(showOptionsSetting.controlEl);


    const showPreviewSetting = new Setting(containerEl);
    showPreviewSetting.setName('Show Preview');
    showPreviewSetting.setDesc('Will display a preview panel in the insertion dialog/modal');
    const showPreviewToggle = this.factory.createShowPreviewToggle(showPreviewSetting.controlEl);

    const resetSetting = new Setting(containerEl);
    resetSetting.setName("Restore Settings");
    resetSetting.setDesc('Returns settings to default');
    const resetButton = this.factory.createResetButton(resetSetting.controlEl);
    resetButton.afterReset(()=>{
      // reset the display after the settings have been reset
      this.display();
    });
	}
}

type SettingsFactoryStyles = 'heightInput' 
  | 'widthInput'
  | 'inputModeDropdown';

export class SettingsFactory {
  plugin: ChemDrawSvgPlugin;
  
  styles: { [ property in SettingsFactoryStyles ]: CSS.Properties} = {
    heightInput: {
      width: '50px',
      textAlign: 'center'
    },
    widthInput: {
      width: '50px',
      textAlign: 'center'
    },
    inputModeDropdown: {
      minWidth: '115px'
    }
  }

  constructor(plugin: ChemDrawSvgPlugin) {
    this.plugin = plugin;
  }
  
  createAutoCropToggle(parent: HTMLElement) {
    const toggleComponent = new BetterToggleComponent(parent);
    toggleComponent.setValue(this.plugin.settings.svg.autoCrop);
    toggleComponent.onChange(async (value)=>{
      this.plugin.settings.svg.autoCrop = value;
      await this.plugin.saveSettings();
    })
    return toggleComponent;
  }
  
  createHeightInput(parent: HTMLElement) {
    const numberComponent = new NumberComponent(parent);
    Object.assign(numberComponent.inputEl.style, this.styles.heightInput);
    numberComponent.setNumericValue(this.plugin.settings.svg.height)
    numberComponent.onValidChange(async (value)=>{
      this.plugin.settings.svg.height = value;
      await this.plugin.saveSettings();
    })
    return numberComponent;
  }

  createWidthInput(parent: HTMLElement) {
    const numberComponent = new NumberComponent(parent);
    Object.assign(numberComponent.inputEl.style, this.styles.widthInput);
    numberComponent.setNumericValue(this.plugin.settings.svg.width)
    numberComponent.onValidChange(async (value)=>{
      this.plugin.settings.svg.width = value;
      await this.plugin.saveSettings();
    })
    return numberComponent;
  }

  createResetButton(parent: HTMLElement) {
    const button = new ResetButton(parent);
    button.setCta();
    button.setButtonText('Reset');
    button.buttonEl.addEventListener('click', (async ()=>{
      await this.plugin.resetSettings();
      button.callAfterReset();
    }));

    return button;
  }

  createInputModeDropdown(parent: HTMLElement) {
    const dropdown = new DropdownComponent(parent);
    Object.assign(dropdown.selectEl.style, this.styles.inputModeDropdown);
    dropdown.addOption('SMILES', SettingLabels.dropdown.smiles);
    dropdown.addOption('IUPAC', SettingLabels.dropdown.iupac);
    dropdown.addOption('FORMULA', SettingLabels.dropdown.formula);
    
    dropdown.setValue(this.plugin.settings.inputMode);
    dropdown.onChange(async value=>{
      this.plugin.settings.inputMode = value as InputModeTypes;
      await this.plugin.saveSettings();
    })

    return dropdown;
  }

  createShowPreviewToggle(parent: HTMLElement) {
    const toggle = new BetterToggleComponent(parent);
    toggle.setValue(this.plugin.settings.showPreview);

    toggle.onChange(async (value)=>{
      this.plugin.settings.showPreview = value;
      await this.plugin.saveSettings();
    })
    return toggle;
  }

  createShowOptionsToggle(parent: HTMLElement) {
    const toggle = new BetterToggleComponent(parent);
    toggle.setValue(this.plugin.settings.showOptions);
    toggle.onChange(async (value)=>{
      this.plugin.settings.showOptions = value;
      await this.plugin.saveSettings();
    })

    return toggle;
  }
}



class NumberComponent extends TextComponent {
  constructor(parent: HTMLElement, options?: { min?: number; max?: number }) {
    super(parent);

    if(options?.min !== undefined) this.setMin(options.min);
    if(options?.max !== undefined) this.setMax(options.max);
    
  }

  showWarning() {
    this.onChange(textValue=>{
      if(this.isValid()) {
        this.inputEl.classList.remove('warning');
      } else {        
        this.inputEl.classList.add('warning');
      }
    });
  }
  
  setMin(min: number) {
    this.inputEl.setAttr('min', min);
  }

  setMax(max: number) {
    this.inputEl.setAttr('max', max);
  }

  isValid() {
    return (this.inputEl.value !== '' && this.inputEl.validity.valid);
  }

  onValidChange(callback: (value: number) => void): this {
    this.onChange(textValue=>{
      if(this.isValid()) callback(parseInt(textValue));
    }) 
    return this;
  }

  setNumericValue(value: number) {
    this.setValue(value.toString());
  }

}

class ResetButton extends ButtonComponent {
  callbacks: (()=>void)[] = [];
  constructor(parent: HTMLElement) {
    super(parent);

    // this.buttonEl.addEventListener('click', ()=>this.onReset());

  }

  afterReset(callback: ()=>void) {
    this.callbacks.push(callback);
  }

  callAfterReset() {
    this.callbacks.forEach(callback=>callback());
  }
}

class BetterToggleComponent extends ToggleComponent {
  onChangeCallbacks: ((value: boolean)=>void)[] = [];

  constructor(parent: HTMLElement) {
    super(parent);
    super.onChange(value=>{
      this.runCallbacks(value);
    })
  }
  private runCallbacks(value: boolean) {
    this.onChangeCallbacks.forEach(callback=>callback(value))
  }
  onChange(callback: (value: boolean) => void) {
    this.onChangeCallbacks.push(callback);
    return this;
  }

  toggle() {
    const newValue = !this.getValue()
    this.setValue(newValue);
  }
}