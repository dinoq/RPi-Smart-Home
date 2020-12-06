export class Singleton{
    static instance: Singleton;

    public static getInstance(): Singleton{
    	if(this.instance == undefined){
			this.instance = new this();
        }
    	return this.instance;
    }

}