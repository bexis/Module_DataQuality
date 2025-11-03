import { Api } from "@bexis2/bexis2-core-ui";
import { setApiConfig } from '@bexis2/bexis2-core-ui';




// Fetch data from API and return as JSON object
export const getData = async (endpoint, id) => {
    //setApiConfig('http://localhost:44345/', 'epetzold', '2021.B2.Go$On');
    try{
        console.log("Fetching data from API for ID:", id);
          
    const response = await Api.get(endpoint + '/' + id);
    console.log("Data fetched from API:", response.data);
    return response.data;
    }
    catch(error){
        console.error(error);
    }

}

