import faqService from "../service/faqService.js";

export const createFAQ = async (req, res) => {
  try {
    const faq = await faqService.createFAQ(req.body);


    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    console.error("createFAQ error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllFAQs = async (req, res) => {
  try {
    const { globalOnly } = req.query;

    const filters = {};
    if (globalOnly === "true") filters.courseId = null;

    const cacheKey = `faqs:all:${JSON.stringify(filters)}`;

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'FAQs fetched from cache',
    //     data: JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const faqs = await faqService.getAllFAQs(filters);

    res.status(200).json({
      success: true,
      message: "FAQs fetched successfully",
      data: faqs,
    });
  } catch (error) {
    console.error("getAllFAQs error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFAQById = async (req, res) => {
  try {
    const faqId = req.params.id;
    const cacheKey = `faq:${faqId}`;


    const faq = await faqService.getFAQById(faqId);
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }


    res.status(200).json({
      success: true,
      message: "FAQ fetched successfully",
      data: faq,
    });
  } catch (error) {
    console.error("getFAQById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseFAQs = async (req, res) => {
  try {
    const { courseId } = req.params;
    const cacheKey = `faqs:course:${courseId}`;

    // const cached = await redis.get(cacheKey);
    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Course FAQs fetched from cache',
    //     data: JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const faqs = await faqService.getFAQsByCourseId(courseId);
    // await redis.setEx(cacheKey, 300, JSON.stringify(faqs));

    res.status(200).json({
      success: true,
      message: "Course FAQs fetched successfully",
      data: faqs,
    });
  } catch (error) {
    console.error("getCourseFAQs error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const updated = await faqService.updateFAQ(req.params.id, req.body);

    if (updated.courseId) {
    }

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateFAQ error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const deleted = await faqService.deleteFAQ(req.params.id);

    if (deleted?.courseId) {
    }

    res
      .status(200)
      .json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("deleteFAQ error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
