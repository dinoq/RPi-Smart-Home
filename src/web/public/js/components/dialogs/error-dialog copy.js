export class ErrorDialog extends HTMLElement {
    constructor(error) {
        super();
        this.innerHTML = `
            ${error} 
            <div id="close-btn">
                close
            </div>
        `;
        document.body.appendChild(this);
        document.getElementById("close-btn").onclick = () => {
            this.remove();
        };
    }
}
customElements.define("error-dialog", ErrorDialog);
