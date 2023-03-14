import { Plugin, debounce, View } from "obsidian";
import isUrl from "is-url";
import path from 'path';
import { PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";

/**
 * 
 * @todo can't figure out exactly why Obsidian is loading images from 
 *       app://obsidian.md/ImageName.png on the initial load of a note
 *  
 */

function getUriPrefix(uri: string) {
  const index = uri.indexOf('//');
  if (!index) return '';
  return uri.substring(0, index + 2);
}

export default class HtmlLocalSrcPlugin extends Plugin {

  async onload() {

    this.registerEditorExtension(this.getEditorViewPlugin());

    this.registerMarkdownPostProcessor((content) => this.modifyImages(content));
  }

  modifyImages(content: HTMLElement) {

    const directoryPath = this.getActiveDirectoryPath(),
      rootPath = this.getVaultRootPath(),
      images = this.getImages(content);


    // halt processing if there are no images or there isn't an open note
    if (!directoryPath || !images.length) return;

    // loop through each image and replace the src tag with one that works within the application
    images.forEach(img => {
      const src = img.getAttr('src');

      // images without an src are not my problem.
      if (!src) {
        return;
      }

      // assume that images with valid URIs are external, so can be left alone.
      if (isUrl(src)) return;

      var schema = "", resourcePath = "";
      // the image has an absolute path
      if (path.isAbsolute(src)) {
        schema = getUriPrefix(rootPath);
        resourcePath = rootPath.substring(schema.length);
      }
      // the image has a relative path
      else {
        schema = getUriPrefix(directoryPath);
        resourcePath = directoryPath.substring(schema.length);
      }

      // decode and then encode the uri to make sure we don't re-encode already encoded characters
      var encodedSrc = encodeURI(decodeURI(src));
      img.srcset = schema + path.join(resourcePath, encodedSrc);

    });
  }

  /** returns the active file */
  getActiveFile() {
    return this.app.workspace.getActiveFile();
  }

  /** returns the directory path of the currently active file */
  getActiveDirectoryPath() {
    const activeFile = this.getActiveFile();
    if (!activeFile) return null

    const resourcePath = this.app.vault.getResourcePath(activeFile);
    return resourcePath.substring(0, resourcePath.lastIndexOf("/"));
  }

  getVaultRootPath() {
    const root = this.app.vault.getRoot();
    const rootPath = root.vault.adapter.getResourcePath('');
    return rootPath.substring(0, rootPath.lastIndexOf('?'));
  }
  getImages(element: HTMLElement) {
    return Array.from(element.getElementsByTagName("img"));
  }

  private getEditorViewPlugin() {
    const plugin = this;

    return ViewPlugin.fromClass(
      class EditorViewPlugin implements PluginValue {

        debouncedUpdate = debounce((content: HTMLElement) => plugin.modifyImages(content));

        update(update: ViewUpdate) {
          this.debouncedUpdate(update.view.contentDOM);
        }

      }
    )
  }
}
