import {} from '@'
export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(3),
  };
}
