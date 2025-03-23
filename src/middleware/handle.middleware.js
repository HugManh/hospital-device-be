const errorHandlerMiddleware = (err, res) => {
    console.error(err.stack);
    res.status(500).send('Oops! Something went wrong.');
};

module.exports = { errorHandlerMiddleware };
