import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Formato de token invalido" });
    }

    token = token.split(" ")[1];

    try {
        const { id_usuario, usuario, id_role } = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.id_usuario = id_usuario;
        req.usuario = usuario;
        req.id_role = id_role;
        next();
    } catch (error) {
        // 401 Unauthorized: el token es inválido o expiró (no es un 400 de datos).
        return res.status(401).json({ error: "Token invalido" });
    }
};

export const verifyAdmin = (req, res, next) => {
    if (req.id_role == 1) {
        return next();
    }
    return res
        .status(403)
        .json({ error: "Autorizado solo para usuario administrador" });
};

export const verifyCoordinador = (req, res, next) => {
    if (req.id_role == 2 || req.id_role == 1) {
        return next();
    }
    return res
        .status(403)
        .json({ error: "Autorizado solo para personal coordinador" });
};

export const verifySupervisor = (req, res, next) => {
    if (req.id_role == 3 || req.id_role == 2 || req.id_role == 1) {
        return next();
    }
    return res
        .status(403)
        .json({ error: "Autorizado solo personal supervisor" });
};

export const verifyOperativo = (req, res, next) => {
    if (
        req.id_role == 4 ||
        req.id_role == 3 ||
        req.id_role == 2 ||
        req.id_role == 1
    ) {
        return next();
    }
    return res
        .status(403)
        .json({ error: "Autorizado solo para personal operativo" });
};
