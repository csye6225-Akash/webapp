import app from "./api/app.js";

const port = 8080;
app.listen(port, () => {
    console.log(`App listening on ${port}`);
});
