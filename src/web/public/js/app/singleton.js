export class Singleton {
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new this();
        }
        return this.instance;
    }
}
