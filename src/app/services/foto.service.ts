import { Injectable } from '@angular/core';
import {Camera, CameraPhoto, CameraResultType, CameraSource, Photo} from '@capacitor/camera'
import {Filesystem, Directory} from '@capacitor/filesystem'
import {Storage} from '@capacitor/storage'
import {Foto} from '../models/foto.interface'

@Injectable({
  providedIn: 'root'
})
export class FotoService {

  //Almacenamiento de fotos
  public fotos: Foto [] = [];
  private PHOTO_STORAGE: string = "fotos"

  constructor() { }

  public async agregarFoto()
  {
    //Tomar foto
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      //allowEditing: true,
      source: CameraSource.Camera,
      quality:10
      
    })

    /*this.fotos.unshift({
      filepath: "foto_",
      webviewPath: fotoCapturada.webPath
    })*/

    const savedImageFile = await this.savePicture(fotoCapturada)
    this.fotos.unshift(savedImageFile)
      
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.fotos)
    })  
  }

  public async savePicture(cameraPhoto: CameraPhoto){
    //Convertir la foto a base64
    const base64Data = await this.readAsBase64(cameraPhoto)
    //Guardar foto en el directorio
    const fileName = new Date().getTime + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    }

  }

  public async readAsBase64(cameraPhoto: CameraPhoto){
    //Convertir de blob a Base64
    const response = await fetch(cameraPhoto.webPath!)
    const blob = await response.blob()

    return await this.convertBlobToBase64(blob) as string
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader
    reader.onerror = reject
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsDataURL(blob)
  })

  public async loadSaved(){
    //Cargar fotos guardadas
    const listaFotos = await Storage.get({ key: this.PHOTO_STORAGE })
    this.fotos = JSON.parse((listaFotos.value) || '{}')

    //Fotos leídas a base64

    for(let foto of this.fotos){
      const readFile = await Filesystem.readFile({
        path: foto.filepath,
        directory: Directory.Data
      })

      //Cargar fotos en navegador
      foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`

    }
  }

}
