export interface IComponentController {
    element: Element;
    $onInit (element: Element);
}

export interface IComponent {
    selector: string;
    controller: IComponentController;
    template: string;
    directives?: IComponent[];
}
