const express = require("express");
const router = express.Router();

const db = require("../db");


// =====================================================
// HOD LOGIN
// =====================================================

router.post("/login", (req, res) => {

    console.log(
        "========== HOD LOGIN ROUTE HIT =========="
    );

    console.log(
        "Request Body:",
        req.body
    );


    const hodid =
        req.body.hodid;

    const password =
        req.body.password;


    if (!hodid || !password) {

        return res.redirect(
            "/auth/hodfile.html?error=" +
            encodeURIComponent(
                "Please enter your HOD ID and Password"
            )
        );

    }


    const sql = `

        SELECT

            hod_id,
            name,
            email,
            password,
            department

        FROM hod

        WHERE hod_id = ?
        AND password = ?

        LIMIT 1

    `;


    db.query(
        sql,
        [
            hodid,
            password
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "❌ HOD Database Error:",
                    err
                );

                return res.redirect(
                    "/auth/hodfile.html?error=" +
                    encodeURIComponent(
                        "Unable to connect to the database"
                    )
                );

            }


            if (
                !result ||
                result.length === 0
            ) {

                console.log(
                    "❌ Invalid HOD ID or Password"
                );

                return res.redirect(
                    "/auth/hodfile.html?error=" +
                    encodeURIComponent(
                        "Invalid HOD ID or Password"
                    )
                );

            }


            const hod =
                result[0];


            req.session.hod = {

                hod_id:
                    hod.hod_id,

                name:
                    hod.name,

                email:
                    hod.email,

                department:
                    hod.department

            };


            console.log(
                "✅ HOD Login Success:",
                hod.name
            );


            req.session.save(
                (sessionError) => {

                    if (sessionError) {

                        console.error(
                            "❌ HOD Session Save Error:",
                            sessionError
                        );

                        return res.redirect(
                            "/auth/hodfile.html?error=" +
                            encodeURIComponent(
                                "Unable to create login session"
                            )
                        );

                    }


                    console.log(
                        "✅ HOD session saved"
                    );


                    return res.redirect(
                        "/dashboard/hod-dashboard.html"
                    );

                }
            );

        }
    );

});


// =====================================================
// HOD INFORMATION
// =====================================================

router.get("/info", (req, res) => {

    console.log(
        "========== HOD INFO ROUTE =========="
    );


    if (
        !req.session ||
        !req.session.hod
    ) {

        return res.status(401).json({

            success: false,

            logged: false,

            message:
                "HOD not logged in"

        });

    }


    return res.json({

        success: true,

        logged: true,

        hod: {

            hod_id:
                req.session.hod.hod_id,

            name:
                req.session.hod.name,

            email:
                req.session.hod.email,

            department:
                req.session.hod.department

        }

    });

});


// =====================================================
// HOD DASHBOARD
// =====================================================

router.get("/dashboard", (req, res) => {

    console.log(
        "========== HOD DASHBOARD ROUTE =========="
    );


    if (
        !req.session ||
        !req.session.hod
    ) {

        return res.status(401).json({

            success: false,

            message:
                "HOD not logged in"

        });

    }


    const department =
        req.session.hod.department;


    console.log(
        "HOD Department:",
        department
    );


    // =================================================
    // LOAD FACULTY
    // =================================================

    const facultySQL = `

        SELECT

            faculty_id,
            name,
            email,
            department

        FROM faculty

        WHERE LOWER(TRIM(department))
            = LOWER(TRIM(?))

        ORDER BY name ASC

    `;


    db.query(
        facultySQL,
        [department],
        (facultyError, facultyList) => {

            if (facultyError) {

                console.error(
                    "❌ Faculty Dashboard Error:",
                    facultyError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to load faculty data"

                });

            }


            // =================================================
            // FIND ACTIVE CYCLE
            // =================================================

            const cycleSQL = `

                SELECT

                    id,
                    name,
                    start_date,
                    end_date,
                    status

                FROM feedback_cycles

                WHERE status = 'active'

                ORDER BY id ASC

            `;


            db.query(
                cycleSQL,
                (cycleError, activeCycles) => {

                    if (cycleError) {

                        console.error(
                            "❌ HOD Cycle Error:",
                            cycleError
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to load feedback cycle"

                        });

                    }


                    // =================================================
                    // NO ACTIVE CYCLE
                    // =================================================

                    if (
                        activeCycles.length === 0
                    ) {

                        return res.json({

                            success: true,

                            department:
                                department,

                            activeCycle:
                                null,

                            totalFaculties:
                                facultyList.length,

                            totalFeedback:
                                0,

                            averageRating:
                                "0.00",

                            facultyWithFeedback:
                                0,

                            bestFaculty:
                                null,

                            lowestFaculty:
                                null,

                            facultyList:
                                facultyList.map(
                                    faculty => ({

                                        faculty_id:
                                            faculty.faculty_id,

                                        name:
                                            faculty.name,

                                        email:
                                            faculty.email,

                                        department:
                                            faculty.department,

                                        totalFeedback:
                                            0,

                                        rating:
                                            "0.00"

                                    })
                                )

                        });

                    }


                    // =================================================
                    // MULTIPLE ACTIVE CYCLES
                    // =================================================

                    if (
                        activeCycles.length !== 1
                    ) {

                        console.error(
                            "❌ Multiple active cycles detected."
                        );

                        return res.status(409).json({

                            success: false,

                            code:
                                "MULTIPLE_ACTIVE_CYCLES",

                            message:
                                "Feedback-cycle configuration is invalid because multiple cycles are active."

                        });

                    }


                    const activeCycle =
                        activeCycles[0];


                    const cycleId =
                        activeCycle.id;


                    console.log(
                        "✅ HOD Active Cycle:",
                        activeCycle.name,
                        "ID:",
                        cycleId
                    );


                    // =================================================
                    // DEPARTMENT STATISTICS
                    // =================================================

                    const statsSQL = `

                        SELECT

                            COUNT(*) AS totalFeedback,

                            COALESCE(

                                AVG(

                                    (
                                        teaching +
                                        communication +
                                        behaviour
                                    ) / 3

                                ),

                                0

                            ) AS averageRating

                        FROM feedback

                        WHERE cycle_id = ?

                        AND LOWER(TRIM(department))
                            = LOWER(TRIM(?))

                    `;


                    db.query(
                        statsSQL,
                        [
                            cycleId,
                            department
                        ],
                        (statsError, statsResult) => {

                            if (statsError) {

                                console.error(
                                    "❌ Feedback Statistics Error:",
                                    statsError
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Unable to load feedback statistics"

                                });

                            }


                            const totalFeedback =
                                Number(
                                    statsResult[0]?.totalFeedback || 0
                                );


                            const averageRating =
                                Number(
                                    statsResult[0]?.averageRating || 0
                                );


                            // =================================================
                            // FACULTY PERFORMANCE
                            // =================================================

                            const performanceSQL = `

                                SELECT

                                    f.faculty_id,

                                    f.name,

                                    f.email,

                                    f.department,

                                    COUNT(fb.id)
                                        AS totalFeedback,

                                    COALESCE(

                                        AVG(

                                            (
                                                fb.teaching +
                                                fb.communication +
                                                fb.behaviour
                                            ) / 3

                                        ),

                                        0

                                    ) AS rating

                                FROM faculty f

                                LEFT JOIN feedback fb

                                    ON fb.faculty_id =
                                        f.faculty_id

                                    AND fb.cycle_id =
                                        ?

                                WHERE LOWER(TRIM(f.department))
                                    = LOWER(TRIM(?))

                                GROUP BY

                                    f.faculty_id,
                                    f.name,
                                    f.email,
                                    f.department

                                ORDER BY
                                    rating DESC

                            `;


                            db.query(
                                performanceSQL,
                                [
                                    cycleId,
                                    department
                                ],
                                (
                                    performanceError,
                                    performanceRows
                                ) => {

                                    if (performanceError) {

                                        console.error(
                                            "❌ Faculty Performance Error:",
                                            performanceError
                                        );

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Unable to load faculty performance"

                                        });

                                    }


                                    // =================================================
                                    // BUILD FINAL FACULTY LIST
                                    // =================================================

                                    const finalFacultyList =
                                        performanceRows.map(
                                            faculty => ({

                                                faculty_id:
                                                    faculty.faculty_id,

                                                name:
                                                    faculty.name,

                                                email:
                                                    faculty.email,

                                                department:
                                                    faculty.department,

                                                totalFeedback:
                                                    Number(
                                                        faculty.totalFeedback || 0
                                                    ),

                                                rating:
                                                    Number(
                                                        faculty.rating || 0
                                                    ).toFixed(2)

                                            })
                                        );


                                    const facultyWithFeedback =
                                        finalFacultyList.filter(
                                            faculty =>
                                                faculty.totalFeedback > 0
                                        );


                                    // =================================================
                                    // BEST FACULTY
                                    // =================================================

                                    let bestFaculty =
                                        null;


                                    if (
                                        facultyWithFeedback.length > 0
                                    ) {

                                        const sortedBest =
                                            [
                                                ...facultyWithFeedback
                                            ].sort(
                                                (a, b) =>
                                                    Number(b.rating) -
                                                    Number(a.rating)
                                            );


                                        bestFaculty = {

                                            faculty_id:
                                                sortedBest[0].faculty_id,

                                            name:
                                                sortedBest[0].name,

                                            rating:
                                                Number(
                                                    sortedBest[0].rating
                                                )

                                        };

                                    }


                                    // =================================================
                                    // LOWEST FACULTY
                                    // =================================================

                                    let lowestFaculty =
                                        null;


                                    if (
                                        facultyWithFeedback.length > 0
                                    ) {

                                        const sortedLowest =
                                            [
                                                ...facultyWithFeedback
                                            ].sort(
                                                (a, b) =>
                                                    Number(a.rating) -
                                                    Number(b.rating)
                                            );


                                        lowestFaculty = {

                                            faculty_id:
                                                sortedLowest[0].faculty_id,

                                            name:
                                                sortedLowest[0].name,

                                            rating:
                                                Number(
                                                    sortedLowest[0].rating
                                                )

                                        };

                                    }


                                    // =================================================
                                    // FINAL RESPONSE
                                    // =================================================

                                    return res.json({

                                        success: true,

                                        department:
                                            department,

                                        activeCycle: {

                                            id:
                                                activeCycle.id,

                                            name:
                                                activeCycle.name,

                                            start_date:
                                                activeCycle.start_date,

                                            end_date:
                                                activeCycle.end_date,

                                            status:
                                                activeCycle.status

                                        },

                                        totalFaculties:
                                            finalFacultyList.length,

                                        totalFeedback:
                                            totalFeedback,

                                        averageRating:
                                            averageRating.toFixed(2),

                                        facultyWithFeedback:
                                            facultyWithFeedback.length,

                                        bestFaculty:
                                            bestFaculty,

                                        lowestFaculty:
                                            lowestFaculty,

                                        facultyList:
                                            finalFacultyList

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// INDIVIDUAL FACULTY ANALYSIS
// =====================================================

router.get(
    "/faculty/:facultyId/analysis",
    (req, res) => {

        console.log(
            "========== FACULTY ANALYSIS ROUTE =========="
        );


        if (
            !req.session ||
            !req.session.hod
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "HOD not logged in"

            });

        }


        const facultyId =
            req.params.facultyId;


        const department =
            req.session.hod.department;


        // =================================================
        // VERIFY FACULTY
        // =================================================

        const facultySQL = `

            SELECT

                faculty_id,
                name,
                email,
                department

            FROM faculty

            WHERE faculty_id = ?

            AND LOWER(TRIM(department))
                = LOWER(TRIM(?))

            LIMIT 1

        `;


        db.query(
            facultySQL,
            [
                facultyId,
                department
            ],
            (
                facultyError,
                facultyResult
            ) => {

                if (facultyError) {

                    console.error(
                        "❌ Faculty Analysis Error:",
                        facultyError
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to load faculty"

                    });

                }


                if (
                    !facultyResult ||
                    facultyResult.length === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Faculty not found"

                    });

                }


                const faculty =
                    facultyResult[0];


                // =================================================
                // FIND ACTIVE CYCLE
                // =================================================

                const cycleSQL = `

                    SELECT

                        id,
                        name,
                        start_date,
                        end_date,
                        status

                    FROM feedback_cycles

                    WHERE status = 'active'

                    ORDER BY id ASC

                `;


                db.query(
                    cycleSQL,
                    (cycleError, cycles) => {

                        if (cycleError) {

                            console.error(
                                "❌ Faculty Analysis Cycle Error:",
                                cycleError
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Unable to load feedback cycle"

                            });

                        }


                        // =================================================
                        // NO ACTIVE CYCLE
                        // =================================================

                        if (
                            cycles.length === 0
                        ) {

                            return res.json({

                                success: true,

                                activeCycle:
                                    null,

                                faculty: {

                                    faculty_id:
                                        faculty.faculty_id,

                                    name:
                                        faculty.name,

                                    email:
                                        faculty.email,

                                    department:
                                        faculty.department

                                },

                                totalFeedback:
                                    0,

                                averageRating:
                                    0,

                                teaching:
                                    0,

                                communication:
                                    0,

                                behaviour:
                                    0

                            });

                        }


                        // =================================================
                        // MULTIPLE ACTIVE CYCLES
                        // =================================================

                        if (
                            cycles.length !== 1
                        ) {

                            console.error(
                                "❌ Multiple active cycles detected."
                            );

                            return res.status(409).json({

                                success: false,

                                code:
                                    "MULTIPLE_ACTIVE_CYCLES",

                                message:
                                    "Feedback-cycle configuration is invalid."

                            });

                        }


                        const activeCycle =
                            cycles[0];


                        // =================================================
                        // FEEDBACK ANALYSIS
                        // =================================================

                        const analysisSQL = `

                            SELECT

                                COUNT(*) AS totalFeedback,

                                COALESCE(
                                    AVG(teaching),
                                    0
                                ) AS teaching,

                                COALESCE(
                                    AVG(communication),
                                    0
                                ) AS communication,

                                COALESCE(
                                    AVG(behaviour),
                                    0
                                ) AS behaviour,

                                COALESCE(

                                    AVG(

                                        (
                                            teaching +
                                            communication +
                                            behaviour
                                        ) / 3

                                    ),

                                    0

                                ) AS averageRating

                            FROM feedback

                            WHERE faculty_id = ?

                            AND cycle_id = ?

                            AND LOWER(TRIM(department))
                                = LOWER(TRIM(?))

                        `;


                        db.query(
                            analysisSQL,
                            [
                                facultyId,
                                activeCycle.id,
                                department
                            ],
                            (
                                analysisError,
                                analysisResult
                            ) => {

                                if (analysisError) {

                                    console.error(
                                        "❌ Faculty Feedback Analysis Error:",
                                        analysisError
                                    );

                                    return res.status(500).json({

                                        success: false,

                                        message:
                                            "Unable to load faculty feedback"

                                    });

                                }


                                const result =
                                    analysisResult[0] || {};


                                return res.json({

                                    success: true,

                                    activeCycle: {

                                        id:
                                            activeCycle.id,

                                        name:
                                            activeCycle.name,

                                        start_date:
                                            activeCycle.start_date,

                                        end_date:
                                            activeCycle.end_date,

                                        status:
                                            activeCycle.status

                                    },

                                    faculty: {

                                        faculty_id:
                                            faculty.faculty_id,

                                        name:
                                            faculty.name,

                                        email:
                                            faculty.email,

                                        department:
                                            faculty.department

                                    },

                                    totalFeedback:
                                        Number(
                                            result.totalFeedback || 0
                                        ),

                                    averageRating:
                                        Number(
                                            result.averageRating || 0
                                        ),

                                    teaching:
                                        Number(
                                            result.teaching || 0
                                        ),

                                    communication:
                                        Number(
                                            result.communication || 0
                                        ),

                                    behaviour:
                                        Number(
                                            result.behaviour || 0
                                        )

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// =====================================================
// HOD LOGOUT
// =====================================================

router.get("/logout", (req, res) => {

    console.log(
        "========== HOD LOGOUT =========="
    );


    req.session.destroy(
        (err) => {

            if (err) {

                console.error(
                    "❌ HOD Logout Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Logout failed"

                });

            }


            res.clearCookie(
                "connect.sid"
            );


            console.log(
                "✅ HOD logged out successfully"
            );


            return res.redirect(
                "/auth/hodfile.html"
            );

        }
    );

});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;