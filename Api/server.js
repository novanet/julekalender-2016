// BASE SETUP
// =============================================================================
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var _ = require('lodash');

// AZURE SQL DATABASE CONNECTION USING SERIATE
// ===================================================================================
var sql = require( "seriate" );
var config = {  
    "server": process.env.server,
	"port": 1433,
    "user": process.env.user,
    "password": process.env.password,
    "database": process.env.database,
    "pool": { "max": 5, "min": 1 },
	"options": { "encrypt": true }
};
sql.setDefaultConfig( config );

// CONFIG
// ===================================================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if ('OPTIONS' == req.method){
        return res.send(200);
    }
    next();
});
app.use(function (req, res, next) {
	res.header('Content-Type', 'application/json; charset=utf-8');
	next();
});

var port = process.env.PORT || 3000;        // set the port

// ROUTES FOR THE API
// ===================================================================================
var router = express.Router();

router.get('/calendar', function (req, res) {
	sql.execute({  
        query: 'SELECT Id, ForDate, [Location], Country, [Image], 0 as IsToday FROM [dbo].[Image] WHERE ForDate < CAST(GETDATE() AS DATE) UNION ALL SELECT Id, ForDate, NULL, NULL, [Image], 1 as IsToday FROM [dbo].[Image]  WHERE ForDate = CAST(GETDATE() AS DATE) UNION ALL SELECT Id, ForDate, NULL, NULL, NULL, 0 as IsToday FROM [dbo].[Image]  WHERE ForDate > CAST(GETDATE() AS DATE)'
    }).then( function( results ) {
        res.send(results);
    }).catch(function(error){
		res.json(error);
		throw error;
	});	
});
	
router.route('/answers')    
	.get(function(req, res) {
		sql.execute({  
			query: 	'SELECT RANK() OVER (ORDER BY SUM(D.[Poeng]) DESC) AS [Rank], D.[User], SUM(D.[Poeng]) AS Points ' +
					'FROM ( ' +
						'SELECT A.[User], CAST(A.[When] AS DATE) AS Dato, SUM(CASE WHEN LocationIsCorrect = 1 THEN 1 ELSE 0 END) + SUM(CASE WHEN CountryIsCorrect = 1 THEN 1 ELSE 0 END) as Poeng  ' +
						'FROM dbo.[Answer] A  ' +	
						'WHERE A.[When] = (SELECT MAX([When]) FROM dbo.[Answer] WHERE [User] = A.[User] AND CAST([When] AS DATE) = CAST(A.[When] AS DATE)) ' +
						'GROUP BY A.[User], CAST(A.[When] AS DATE) ' +
					') D ' +
					'GROUP BY D.[User] ' +
					'ORDER BY [Rank], [User]'			
		}).then( function( results ) {
			res.send(results);
		}).catch(function(error){
			res.json(error);
			throw error;
		});		
    })
	.post(function(req, res){
        // Add answer			
        sql.execute({  
            query: 'INSERT INTO [dbo].[Answer]([ImageId],[User],[Location],[Country],[When]) VALUES ((SELECT Id FROM dbo.Image WHERE ForDate = CAST(GETDATE() AS DATE)), @user, @location, @country, GETDATE())',
            params: {
                user: {
                    type: sql.VARCHAR,
                    val: req.body.user,
                },
                location: {
                    type: sql.VARCHAR,
                    val: req.body.location,
                },
                country: {
                    type: sql.VARCHAR,
                    val: req.body.country,
                }
            }
        }).then( function() {
            res.json({message: user});
        }).catch(function(error){
            res.json(error);
            throw error;
        });														
	});
	
// REGISTER THE ROUTES
// ===================================================================================
app.use('/api', router);


// START THE SERVER
// ===================================================================================
app.listen(port);
console.log('Listening on port ' + port);
