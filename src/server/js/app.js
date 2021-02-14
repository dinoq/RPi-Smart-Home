module.exports = class ServerApp {
    constructor() {
        /* var p = path.join(__dirname, '../../web/public');
         console.log(' p: ',  p);
         app.use("/files", function (req, res) {
             return res.send("I will be served instead of a files directory");
         });
         app.use(express.static(p));
         app.use('/*',express.static(p));
           app.use("/", function (req, res) {
             return res.redirect(req.url);
           });
 */
        /**
         *
         *
        app.use('/',function (req, res,next) {
            console.log("serve from:", p);
            express.static(p);
            //next();
            //express.static(p);
        });
         */
        //app.get(express.static(p));
        //app.use('/*',express.static(p));
        /*app.use("/", function (req, res) {
            console.log("posledni");
            return res.redirect(req.url);
        });*/
        let port = 8080;
        //var server = app.listen(port);
    }
    start() {
    }
};
