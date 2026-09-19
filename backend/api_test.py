import httpx
import asyncio

async def test_api():
    base_url = "http://127.0.0.1:8000"
    
    print("Uploading document...")
    async with httpx.AsyncClient() as client:
        with open("uploads/02f8c66a-3a7d-4918-a8b0-ddaa1e782fdd.txt", "rb") as f:
            files = {"file": ("lease.txt", f, "text/plain")}
            upload_res = await client.post(f"{base_url}/api/documents/upload", files=files)
            
        print("Upload status:", upload_res.status_code)
        doc_id = upload_res.json().get("id")
        print("Doc ID:", doc_id)
        
        questions = [
            'Does this document mention pets?',
            'When is rent due?',
            'What is the rent amount?',
            'What is the security deposit?',
            'How long is the lease?',
            'Does this document mention swimming pools?'
        ]
        
        for q in questions:
            print(f"\nQuestion: {q}")
            ask_res = await client.post(f"{base_url}/api/documents/{doc_id}/ask", json={"question": q})
            print("Status:", ask_res.status_code)
            data = ask_res.json()
            print(f"Answer: {data.get('answer')}")
            print(f"Found: {data.get('found_in_document')}")
            print(f"Reference: {data.get('reference_snippet')}")

if __name__ == "__main__":
    asyncio.run(test_api())
