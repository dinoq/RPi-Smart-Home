function Cat(name) {
    this.age = 0;
    this.name = name;
}
// now we export the class, so other modules can create Cat objects
module.exports = {
    Cat: Cat
};
