import { IComponent } from '../../toymvc/core'
import { ToyController } from './toy.controller'

export const ToyComponent: IComponent = {
   selector: 'toy',
   controller: ToyController,
   template: `
      <div>
          <h2>{{'toy name ' + $ctrl.toy.name}}</h2>
          <h2>{{'name ' + $ctrl.name}}</h2>
          <input type="text" [(value)]="$ctrl.toy.name" (change)="$ctrl.onChange()" />
          <input type="text" [(value)]="$ctrl.name" (change)="$ctrl.onChangeName()" />
          <input type="button" (click)="$ctrl.onGenerate()" value="generate" class="button clickable" />
      </div>
    `
}

