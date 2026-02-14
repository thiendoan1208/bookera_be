const { jwtDecode } = require("../config/jwt");
const { UserAccess, User } = require("../models");

/**
 * Middleware to verify user authentication
 * Checks if session token from cookie matches token in database
 */
const verifyAuth = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.session_token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        error: "No session token found",
      });
    }

    // Decode and verify JWT token
    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired token",
        error: error.message,
      });
    }

    // Check if token exists in database
    const userAccess = await UserAccess.findOne({
      where: {
        user_id: decoded.userId,
        session_token: token,
      },
      include: [
        {
          model: User,
          as: "users",
          attributes: ["id", "username", "email", "avatar_url", "role_id"],
        },
      ],
    });

    if (!userAccess) {
      // Token not found in database - might be revoked or user logged out
      return res.status(401).json({
        message: "Session expired or invalid",
        error: "Token not found in database",
      });
    }

    // Attach user info to request object
    req.user = userAccess.users;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    // If there's an error, try to clean up invalid token
    try {
      const token = req.cookies.session_token;
      if (token) {
        const decoded = jwtDecode(token);
        await UserAccess.destroy({
          where: { user_id: decoded.userId, session_token: token },
        });
      }
    } catch (cleanupError) {
      console.error("Token cleanup error:", cleanupError);
    }

    return res.status(500).json({
      message: "Authentication error",
      error: error.message,
    });
  }
};

/**
 * Optional middleware - doesn't block request if no auth
 * Just attaches user info if authenticated
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.session_token;

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const decoded = jwtDecode(token);
    const userAccess = await UserAccess.findOne({
      where: {
        user_id: decoded.userId,
        session_token: token,
      },
      include: [
        {
          model: User,
          as: "users",
          attributes: ["id", "username", "email", "avatar_url", "role_id"],
        },
      ],
    });

    if (userAccess) {
      req.user = userAccess.users;
      req.userId = decoded.userId;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    req.user = null;
    req.userId = null;
    next();
  }
};

module.exports = {
  verifyAuth,
  optionalAuth,
};


// ông comment code bên trên uncommnet code dưới này để chạy test thử bằng postman
//code dưới ko có verify auth
// const { jwtDecode } = require("../config/jwt");
// const { UserAccess, User } = require("../models");

// /**
//  * Middleware to verify user authentication
//  * Checks if session token from cookie matches token in database
//  */
// const verifyAuth = async (req, res, next) => {
//   try {
//     // Get token from cookie
//     const token = req.cookies.session_token;

//     if (!token) {
//       return res.status(401).json({
//         message: "Authentication required",
//         error: "No session token found",
//       });
//     }

//     // Decode and verify JWT token
//     let decoded;
//     try {
//       decoded = jwtDecode(token);
//     } catch (error) {
//       return res.status(401).json({
//         message: "Invalid or expired token",
//         error: error.message,
//       });
//     }

//     // Check if token exists in database
//     const userAccess = await UserAccess.findOne({
//       where: {
//         user_id: decoded.userId,
//         session_token: token,
//       },
//       include: [
//         {
//           model: User,
//           as: "users",
//           attributes: ["id", "username", "email", "avatar_url", "role_id"],
//         },
//       ],
//     });

//     if (!userAccess) {
//       // Token not found in database - might be revoked or user logged out
//       return res.status(401).json({
//         message: "Session expired or invalid",
//         error: "Token not found in database",
//       });
//     }

//     // Attach user info to request object
//     req.user = userAccess.users;
//     req.userId = decoded.userId;

//     next();
//   } catch (error) {
//     console.error("Auth middleware error:", error);

//     // If there's an error, try to clean up invalid token
//     try {
//       const token = req.cookies.session_token;
//       if (token) {
//         const decoded = jwtDecode(token);
//         await UserAccess.destroy({
//           where: { user_id: decoded.userId, session_token: token },
//         });
//       }
//     } catch (cleanupError) {
//       console.error("Token cleanup error:", cleanupError);
//     }

//     return res.status(500).json({
//       message: "Authentication error",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Optional middleware - doesn't block request if no auth
//  * Just attaches user info if authenticated
//  */
// const optionalAuth = async (req, res, next) => {
//   try {
//     const token = req.cookies.session_token;

//     if (!token) {
//       req.user = null;
//       req.userId = null;
//       return next();
//     }

//     const decoded = jwtDecode(token);
//     const userAccess = await UserAccess.findOne({
//       where: {
//         user_id: decoded.userId,
//         session_token: token,
//       },
//       include: [
//         {
//           model: User,
//           as: "users",
//           attributes: ["id", "username", "email", "avatar_url", "role_id"],
//         },
//       ],
//     });

//     if (userAccess) {
//       req.user = userAccess.users;
//       req.userId = decoded.userId;
//     } else {
//       req.user = null;
//       req.userId = null;
//     }

//     next();
//   } catch (error) {
//     req.user = null;
//     req.userId = null;
//     next();
//   }
// };

// module.exports = {
//   verifyAuth,
//   optionalAuth,
// };
