const errorHandler = (error, req, res, next) => {
    console.error(error);

    const status = error.statusCode || 500;
    const message = status >= 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message || "Internal server error";

    res.status(status).json({ message });
};

export default errorHandler;
