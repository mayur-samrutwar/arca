import { Research } from '@/schemas/research';
import { connectResearchDB } from '@/utils/db/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectResearchDB();
    
    const { id } = req.query;
    console.log('Fetching research with ID:', id);
    
    const research = await Research.findById(id);
    console.log('Found research:', research);
    
    if (!research) {
      return res.status(404).json({ error: 'Research not found' });
    }

    // Get paper data - prioritize paper field over finalPaper
    const paperData = research.paper;

    if (!paperData || !paperData.title) {
      return res.status(404).json({ error: 'Research paper not found' });
    }

    // Return the complete paper data
    res.status(200).json({
      _id: research._id,
      title: paperData.title,
      abstract: paperData.abstract,
      findings: paperData.findings || [],
      conclusions: paperData.conclusions || [],
      researchers: research.researchers,  // Include researchers for context
      status: research.status
    });
  } catch (error) {
    console.error('Failed to get research paper:', error);
    res.status(500).json({ error: error.message });
  }
}