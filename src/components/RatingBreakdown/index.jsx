import React from "react";
import './index.css';
import {Col, Rate, Row, Typography} from "antd";
import {numberWithCommas} from "../../utils";

export default function RatingBreakdown(props) {
  const {avg = 0, total = 0, count = [0, 0, 0, 0, 0]} = props;
  return (
    <Row>
      <Col span={12}>
        <div className="rating">
          <Typography>Avg. Rating</Typography>
          <span className="rating-num">{avg.toFixed(1)}</span>
          <div className="rating-stars">
            <Rate disabled defaultValue={avg}/>
          </div>
          <div className="rating-users">
            {`${numberWithCommas(total)} total`}
          </div>
        </div>
      </Col>
      <Col span={12}>
        <div className="histo">
          <div className="five histo-rate">
            <span className="histo-star">★ 5 </span>
            <span className="bar-block">
              <span id="bar-five" className="bar" style={{width: count[0] / total * 100 + '%'}}>
                <span>{numberWithCommas(count[0])}</span>&nbsp;
              </span>
            </span>
          </div>

          <div className="four histo-rate">
        <span className="histo-star">
          ★ 4 </span>
            <span className="bar-block">
          <span id="bar-four" className="bar" style={{width: count[1] / total * 100 + '%'}}>
            <span>{numberWithCommas(count[1])}</span>&nbsp;
          </span>
        </span>
          </div>

          <div className="three histo-rate">
        <span className="histo-star">
          ★ 3 </span>
            <span className="bar-block">
          <span id="bar-three" className="bar" style={{width: count[2] / total * 100 + '%'}}>
            <span>{numberWithCommas(count[2])}</span>&nbsp;
          </span>
        </span>
          </div>

          <div className="two histo-rate">
        <span className="histo-star">
          ★ 2 </span>
            <span className="bar-block">
          <span id="bar-two" className="bar" style={{width: count[3] / total * 100 + '%'}}>
            <span>{numberWithCommas(count[3])}</span>&nbsp;
          </span>
        </span>
          </div>

          <div className="one histo-rate">
        <span className="histo-star">
          ★ 1 </span>
            <span className="bar-block">
          <span id="bar-one" className="bar" style={{width: count[4] / total * 100 + '%'}}>
            <span>{numberWithCommas(count[4])}</span>&nbsp;
          </span>
        </span>
          </div>
        </div>
      </Col>
    </Row>
  );
}
