# Lacrado's Threat model

A threat model looks at the security of an application from the attackers perpective. What are the potential weak points, assess them them, and provide potential mitigations or accept the risk.

This is a simplified version of a [threat modeling](https://owasp.org/www-community/Threat_Modeling_Process), and is based on the table proposed in the [holistic assessments](https://unicef.github.io/holistic-assessments-for-ict4d/process/threat-and-risk-assessment.html). 

I'll differentiate between product and deployment solutions. What do I mean by this? Whereas a mitigation from product perspective mitigations can be implemented as part of the source code, a mitigation from the deployment perspective is something the instance owner needs to setup. The only thing we will provide is a recommendation/suggestion as part of the documentation. For example, a bot is creating messages and flooding the database. From the product perspective, a mitigation could be to implement a CAPTCHA. From the deployment perspective, it could be to limit the number of requests per seccond, to put the service in front of a web application firewall or a service that verifies that the user is a human rather than a bot.

Instead of a table, we'll list the threats, so we can ellaborate more on the narrative when needed.

### Threat: A bot creates multiple
Likelyhood: moderately likely. Impact: High. Severity:

## Threat: Database (read) is compromised (moredately unlikely, low)


