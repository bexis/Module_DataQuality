import { Api } from "@bexis2/bexis2-core-ui";
import { setApiConfig } from '@bexis2/bexis2-core-ui';



// Fetch data from API and return as JSON object
export const getData = async () => {
    //setApiConfig('http://localhost:44345/', 'epetzold', '2021.B2.Go$On');
    try{
    const response = await Api.get( "/dov/datasetsoverview/datasetsoverview");
    return response.data;
    }
    catch(error){
        console.error(error);
    }

}

// Fetch data from API and return as JSON object
export const getGenerationDate = async () => {
    //setApiConfig('http://localhost:44345/', 'epetzold', '2021.B2.Go$On');
    try{
    const response = await Api.get( "/dov/datasetsoverview/generationdate");
    return response.data;
    }
    catch(error){
        console.error(error);
    }

}

