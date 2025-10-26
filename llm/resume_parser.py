# llm/resume_parser.py
import PyPDF2
import docx
import io
from fastapi import UploadFile, HTTPException
import re

async def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from PDF file"""
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")

async def extract_text_from_docx(file: UploadFile) -> str:
    """Extract text from DOCX file"""
    try:
        contents = await file.read()
        doc_file = io.BytesIO(contents)
        doc = docx.Document(doc_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX extraction failed: {str(e)}")

async def parse_resume_file(file: UploadFile) -> str:
    """Parse resume file and return extracted text"""
    if file.content_type == "application/pdf":
        return await extract_text_from_pdf(file)
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await extract_text_from_docx(file)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")