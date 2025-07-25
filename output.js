// Generated code for Scratch project
// Target: Stage
function id_1_Stage() {
    let id_2_Request_Method = 0; // Variable: Request.Method
    let id_3_Response_Status = "200"; // Variable: Response.Status
    let id_4_Request_Route = 0; // Variable: Request.Route
    let id_5_Request_Headers_Key = []; // List: Request.Headers.Key
    let id_6_Request_Headers_Value = []; // List: Request.Headers.Value
    let id_7_Request_Body = []; // List: Request.Body
    let id_8_Response_Body = ["<html>","<html>","</body>","</body>"]; // List: Response.Body
    let id_9_Response_Headers_Key = []; // List: Response.Headers.Key
    let id_10_Response_Headers_Value = []; // List: Response.Headers.Value
    function flagClicked() {
    }
    return { flagClicked };
}
// Target: Sprite1
function id_11_Sprite1() {
    let id_12_Iterator = 0; // Variable: Iterator
    function id_13_1fXwQ_BsJCEHn9pvjSmT() {
        id_3_Response_Status = "200"; // Set variable
        id_8_Response_Body.push("<!DOCTYPE html>"); // Add to list
        id_8_Response_Body.push("<html>"); // Add to list
        id_8_Response_Body.push("<head>"); // Add to list
        id_8_Response_Body.push("<body>"); // Add to list
        id_8_Response_Body.push("<h1>God is dead and I have killed him.</h1>"); // Add to list
        id_8_Response_Body.push("<h2>Headers</h1>"); // Add to list
        id_12_Iterator = "0"; // Set variable
        for (let i = 0; i < id_5_Request_Headers_Key.length; i++) {
            id_12_Iterator += Number("1"); // Change variable
            id_8_Response_Body.push(String(String(id_5_Request_Headers_Key["12,Iterator,R5[(!;c(_}h)3%PyehTG"]) + String(": ")) + String(id_6_Request_Headers_Value["12,Iterator,R5[(!;c(_}h)3%PyehTG"])); // Add to list
        }
        id_8_Response_Body.push("</body>"); // Add to list
        id_8_Response_Body.push("</html>"); // Add to list
        id_9_Response_Headers_Key.push("Content-Type"); // Add to list
        id_10_Response_Headers_Value.push("text/html"); // Add to list
    }
    function flagClicked() {
        id_13_1fXwQ_BsJCEHn9pvjSmT(); // Executing block: event_whenflagclicked
    }
    return { flagClicked };
}