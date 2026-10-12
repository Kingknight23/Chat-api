const buckets = new Map();

const rateLimit = ({ windowMs = 60_000, max = 60, message = "Too many requests" } = {}) => {
    return (req, res, next) => {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) || req.socket.remoteAddress || "unknown";
        const key = `${ip}:${req.baseUrl || ""}${req.path || ""}`;
        const now = Date.now();
        let bucket = buckets.get(key);

        if (!bucket || now - bucket.start >= windowMs) {
            bucket = { start: now, count: 0 };
            buckets.set(key, bucket);
        }

        bucket.count += 1;
        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));

        if (bucket.count > max) {
            const retryAfter = Math.ceil((bucket.start + windowMs - now) / 1000);
            res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
            return res.status(429).json({ message });
        }

        next();
    };
};

setInterval(() => {
    const cutoff = Date.now() - 10 * 60_000;
    for (const [key, bucket] of buckets) {
        if (bucket.start < cutoff) buckets.delete(key);
    }
}, 10 * 60_000).unref();

export default rateLimit;
